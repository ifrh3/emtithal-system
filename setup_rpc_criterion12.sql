-- 1. Create the Secure RPC Function to accept reports via API Key
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

    -- Log it in activity_logs
    INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
    VALUES (NULL, 'API_INSERT', 'reports_summary', 'Report #' || v_report_id || ' via ' || v_key_name);

    RETURN jsonb_build_object('success', true, 'report_id', v_report_id, 'message', 'Report submitted successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Secure RPC Function to accept complaints (البلاغات) via API Key
CREATE OR REPLACE FUNCTION public.submit_complaint(
    p_api_key text,
    p_url text,
    p_violation text
) RETURNS jsonb AS $$
DECLARE
    v_key_id int;
    v_key_name text;
BEGIN
    -- Verify API Key (using the key name as the Entity)
    SELECT id, name INTO v_key_id, v_key_name 
    FROM public.api_keys 
    WHERE key = p_api_key AND status = 'active';

    IF v_key_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or inactive API Key.';
    END IF;

    -- Update usage quota for the API key (Optional for complaints, but good for tracking activity)
    UPDATE public.api_keys 
    SET last_used = now() 
    WHERE id = v_key_id;

    -- Insert into complaints table
    INSERT INTO public.complaints (entity, category, standard, url, extension, violation, status, created_at)
    VALUES (
        v_key_name,                  -- entity
        'بلاغ أداة التقييم',        -- category
        'المعيار 12 (الأزرار)',      -- standard
        p_url,                       -- url
        'إضافة كروم (المعيار 12)',   -- extension
        p_violation,                 -- violation details
        'جديد',                      -- default status
        now()
    );

    -- Log it in activity_logs
    INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
    VALUES (NULL, 'API_INSERT', 'complaints', 'Complaint via ' || v_key_name);

    RETURN jsonb_build_object('success', true, 'message', 'Complaint submitted successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Expose the RPCs to anonymous users
GRANT EXECUTE ON FUNCTION public.submit_audit_report(text, text, jsonb, numeric) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_audit_report(text, text, jsonb, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_complaint(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_complaint(text, text, text) TO authenticated;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
