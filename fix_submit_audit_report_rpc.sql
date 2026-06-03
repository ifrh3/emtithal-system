-- Fix RPC used by the browser extension report submit button.
-- Run this in Supabase SQL Editor for the Emtithal project.

ALTER TABLE public.reports_summary
  ADD COLUMN IF NOT EXISTS api_key_id int REFERENCES public.api_keys(id),
  ADD COLUMN IF NOT EXISTS platform_url text,
  ADD COLUMN IF NOT EXISTS raw_report_data jsonb,
  ADD COLUMN IF NOT EXISTS pages_scanned jsonb DEFAULT '[]'::jsonb;

DO $$
BEGIN
  ALTER TABLE public.reports_summary ALTER COLUMN platform_id DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
END $$;

CREATE OR REPLACE FUNCTION public.submit_audit_report(
  p_api_key text,
  p_platform_url text,
  p_report_data jsonb,
  p_score numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_id int;
  v_key_name text;
  v_quota int;
  v_requests int;
  v_report_id public.reports_summary.id%TYPE;
  v_page_url text;
  v_base_domain text;
BEGIN
  SELECT id, name, quota, requests
  INTO v_key_id, v_key_name, v_quota, v_requests
  FROM public.api_keys
  WHERE key = p_api_key
    AND status = 'active';

  IF v_key_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive API Key.';
  END IF;

  IF COALESCE(v_requests, 0) >= COALESCE(v_quota, 10000) THEN
    RAISE EXCEPTION 'API Key quota exceeded.';
  END IF;

  v_page_url := COALESCE(NULLIF(p_report_data->>'pageUrl', ''), p_platform_url);
  v_base_domain := substring(v_page_url from '^(?:https?:\/\/)?(?:www\.)?([^\/]+)');
  v_base_domain := lower(COALESCE(NULLIF(v_base_domain, ''), v_page_url, 'unknown'));

  UPDATE public.api_keys
  SET requests = COALESCE(requests, 0) + 1,
      last_used = now()
  WHERE id = v_key_id;

  IF v_base_domain ~ '(^|\.)sa$' THEN
    INSERT INTO public.reports_summary (
      score,
      report_date,
      api_key_id,
      platform_url,
      raw_report_data,
      pages_scanned
    )
    VALUES (
      p_score,
      now(),
      v_key_id,
      v_base_domain,
      p_report_data,
      jsonb_build_array(v_page_url)
    )
    RETURNING id INTO v_report_id;

    BEGIN
      INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
      VALUES (
        NULL,
        'API_INSERT',
        'reports_summary',
        'Report #' || v_report_id::text || ' via ' || COALESCE(v_key_name, 'API Key') || ' for ' || v_base_domain
      );
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;

    RETURN jsonb_build_object(
      'success', true,
      'report_id', v_report_id,
      'message', 'تم استلام وحفظ التقرير بنجاح في منصة امتثال.'
    );
  END IF;

  BEGIN
    INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
    VALUES (
      NULL,
      'API_IGNORE',
      'reports_summary',
      'Ignored non-SA report for ' || COALESCE(v_page_url, 'unknown')
    );
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم الفحص بدون حفظ؛ الرابط لا ينتهي بـ .sa.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_audit_report(text, text, jsonb, numeric) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_audit_report(text, text, jsonb, numeric) TO authenticated;

NOTIFY pgrst, 'reload schema';
