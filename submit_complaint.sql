CREATE OR REPLACE FUNCTION public.submit_complaint(
  p_api_key text,
  p_entity text,
  p_category text,
  p_standard text,
  p_url text,
  p_extension text,
  p_violation text
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
  v_inserted_id uuid;
  v_base_domain text;
BEGIN
  SELECT id, name, quota, requests
  INTO v_key_id, v_key_name, v_quota, v_requests
  FROM public.api_keys
  WHERE key = p_api_key
    AND status = 'active';

  IF v_key_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive API key.';
  END IF;

  IF COALESCE(v_requests, 0) >= COALESCE(v_quota, 10000) THEN
    RAISE EXCEPTION 'API key quota exceeded.';
  END IF;

  UPDATE public.api_keys
  SET requests = COALESCE(requests, 0) + 1,
      last_used = now()
  WHERE id = v_key_id;

  v_base_domain := substring(p_url from '^(?:https?:\/\/)?(?:www\.)?([^\/]+)');
  IF v_base_domain IS NULL THEN
    v_base_domain := p_url;
  END IF;

  IF v_base_domain IS NULL OR v_base_domain NOT ILIKE '%.sa%' THEN
    INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
    VALUES (NULL, 'EXT_COMPLAINT_IGNORE', 'complaints', 'Ignored non-SA complaint for ' || COALESCE(p_url, 'unknown') || ' via ' || p_extension || ' / ' || COALESCE(v_key_name, 'API Key'));

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Complaint received but not saved because the website is outside .sa.'
    );
  END IF;

  INSERT INTO public.complaints (
    entity,
    category,
    standard,
    url,
    extension,
    violation,
    status,
    created_at
  )
  VALUES (
    p_entity,
    p_category,
    p_standard,
    p_url,
    p_extension,
    p_violation,
    'جديد',
    now()
  )
  RETURNING id INTO v_inserted_id;

  INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
  VALUES (NULL, 'EXT_COMPLAINT', 'complaints', 'Complaint #' || v_inserted_id || ' via ' || p_extension || ' / ' || COALESCE(v_key_name, 'API Key'));

  RETURN jsonb_build_object(
    'success', true,
    'id', v_inserted_id,
    'message', 'Complaint submitted successfully.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_complaint(text, text, text, text, text, text, text)
TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
