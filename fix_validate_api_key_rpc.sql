-- Allows browser extensions to check whether their API key is still active
-- before running local scans or submitting reports.
-- Run this in Supabase SQL Editor for the Emtithal project.

CREATE OR REPLACE FUNCTION public.validate_api_key(
  p_api_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_id int;
  v_key_name text;
  v_status text;
  v_quota int;
  v_requests int;
BEGIN
  SELECT id, name, status, quota, requests
  INTO v_key_id, v_key_name, v_status, v_quota, v_requests
  FROM public.api_keys
  WHERE key = p_api_key;

  IF v_key_id IS NULL THEN
    RETURN jsonb_build_object(
      'active', false,
      'status', 'missing',
      'message', 'مفتاح الربط غير موجود في منصة امتثال.'
    );
  END IF;

  IF v_status IS DISTINCT FROM 'active' THEN
    RETURN jsonb_build_object(
      'active', false,
      'status', v_status,
      'name', v_key_name,
      'message', 'تم إيقاف مفتاح الربط من لوحة تحكم امتثال.'
    );
  END IF;

  IF COALESCE(v_requests, 0) >= COALESCE(v_quota, 10000) THEN
    RETURN jsonb_build_object(
      'active', false,
      'status', 'quota_exceeded',
      'name', v_key_name,
      'message', 'تم تجاوز حد استخدام مفتاح الربط.'
    );
  END IF;

  RETURN jsonb_build_object(
    'active', true,
    'status', v_status,
    'name', v_key_name,
    'remaining', COALESCE(v_quota, 10000) - COALESCE(v_requests, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_api_key(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_api_key(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
