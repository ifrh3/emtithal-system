-- 1. Modify reports_summary table to accept automated reports from the Extension
ALTER TABLE public.reports_summary ADD COLUMN IF NOT EXISTS api_key_id INT REFERENCES public.api_keys(id);
ALTER TABLE public.reports_summary ADD COLUMN IF NOT EXISTS platform_url TEXT;
ALTER TABLE public.reports_summary ADD COLUMN IF NOT EXISTS raw_report_data JSONB;

-- Make platform_id optional in case the API key is used for a new unlinked platform
DO $$
BEGIN
    ALTER TABLE public.reports_summary ALTER COLUMN platform_id DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore if platform_id doesn't exist
END $$;

-- 2. Create the Secure RPC Function to accept reports via API Key
CREATE OR REPLACE FUNCTION public.submit_audit_report(
    p_api_key text,
    p_platform_url text,
    p_report_data jsonb,
    p_score numeric
) RETURNS jsonb AS $$
DECLARE
    v_key_id int;
    v_key_name text;
    v_quota int;
    v_requests int;
    v_report_id int;
BEGIN
    -- Verify API Key
    SELECT id, name, quota, requests INTO v_key_id, v_key_name, v_quota, v_requests 
    FROM public.api_keys 
    WHERE key = p_api_key AND status = 'active';

    IF v_key_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or inactive API Key.';
    END IF;

    IF v_requests >= v_quota THEN
        RAISE EXCEPTION 'API Key quota exceeded.';
    END IF;

    -- Update usage quota for the API key
    UPDATE public.api_keys 
    SET requests = requests + 1, last_used = now() 
    WHERE id = v_key_id;

    -- Insert the report summary
    INSERT INTO public.reports_summary (score, report_date, api_key_id, platform_url, raw_report_data)
    VALUES (p_score, now(), v_key_id, p_platform_url, p_report_data)
    RETURNING id INTO v_report_id;

    -- Log it in activity_logs for audit (No specific user, but we specify the API Key name)
    INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
    VALUES (NULL, 'API_INSERT', 'reports_summary', 'Report #' || v_report_id || ' via ' || v_key_name);

    RETURN jsonb_build_object('success', true, 'report_id', v_report_id, 'message', 'Report submitted successfully via API.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Expose the RPC to anonymous users (Auth is handled by the API key internally)
GRANT EXECUTE ON FUNCTION public.submit_audit_report(text, text, jsonb, numeric) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_audit_report(text, text, jsonb, numeric) TO authenticated;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
