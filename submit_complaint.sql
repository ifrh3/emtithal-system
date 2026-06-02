-- ============================================
-- submit_complaint RPC — إرسال بلاغ آمن من الإضافة
-- ============================================
-- يتحقق من مفتاح API قبل إدراج البلاغ في جدول complaints.
-- أأمن من فتح INSERT مباشر على الجدول.

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
  v_key_exists boolean;
  v_inserted_id uuid;
BEGIN
  -- التحقق من أن مفتاح الإضافة موجود وفعّال في جدول api_keys.
  SELECT EXISTS (
    SELECT 1
    FROM public.api_keys
    WHERE key = p_api_key
      AND status = 'active'
  )
  INTO v_key_exists;

  IF NOT v_key_exists THEN
    RAISE EXCEPTION 'Invalid or inactive API key.';
  END IF;

  -- إدخال البلاغ في جدول complaints.
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

  -- تسجيل العملية في سجل النشاطات.
  INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
  VALUES (NULL, 'EXT_COMPLAINT', 'complaints', 'Complaint #' || v_inserted_id || ' via ' || p_extension);

  RETURN jsonb_build_object(
    'success', true,
    'id', v_inserted_id,
    'message', 'Complaint submitted successfully.'
  );
END;
$$;

-- إعطاء صلاحية التنفيذ للـ anon و authenticated
GRANT EXECUTE ON FUNCTION public.submit_complaint(text, text, text, text, text, text, text)
TO anon, authenticated;

-- إعادة تحميل الـ Schema Cache
NOTIFY pgrst, 'reload schema';
