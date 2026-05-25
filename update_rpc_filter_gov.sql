-- إضافة عمود pages_scanned إن لم يكن موجوداً
ALTER TABLE public.reports_summary ADD COLUMN IF NOT EXISTS pages_scanned JSONB DEFAULT '[]'::jsonb;

-- تحديث الدالة لدمج التقارير
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
    v_report_id uuid;
    v_existing_score numeric;
    v_existing_pages jsonb;
    v_page_url text;
    v_base_domain text;
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

    -- استخراج رابط الصفحة من البيانات
    v_page_url := p_report_data->>'pageUrl';
    IF v_page_url IS NULL THEN
        v_page_url := p_platform_url;
    END IF;

    -- استخراج الدومين الأساسي (مثل uqu.edu.sa) لتجميع الصفحات
    v_base_domain := substring(p_platform_url from '^(?:https?:\/\/)?(?:www\.)?([^\/]+)');
    IF v_base_domain IS NULL THEN
        v_base_domain := p_platform_url;
    END IF;

    -- التحقق من الرابط: هل يحتوي على .sa؟
    IF v_base_domain ILIKE '%.sa%' THEN
        
        -- البحث عن تقرير اليوم لنفس الدومين
        SELECT id, score, pages_scanned INTO v_report_id, v_existing_score, v_existing_pages
        FROM public.reports_summary
        WHERE platform_url = v_base_domain 
          AND api_key_id = v_key_id 
          AND date(report_date) = current_date
        LIMIT 1;

        IF v_report_id IS NOT NULL THEN
            -- التقرير موجود، نقوم بدمجه
            IF v_existing_pages IS NULL THEN
                v_existing_pages := '[]'::jsonb;
            END IF;

            -- إضافة الصفحة الجديدة إن لم تكن موجودة
            IF NOT (v_existing_pages @> jsonb_build_array(v_page_url)) THEN
                v_existing_pages := v_existing_pages || jsonb_build_array(v_page_url);
            END IF;

            UPDATE public.reports_summary
            SET score = (score + p_score) / 2,
                pages_scanned = v_existing_pages,
                raw_report_data = p_report_data -- نستبدل البيانات بآخر فحص لتسهيل العرض
            WHERE id = v_report_id;
            
            INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
            VALUES (NULL, 'API_UPDATE', 'reports_summary', 'Merged Report #' || v_report_id || ' via ' || v_key_name || ' for ' || v_base_domain);

            RETURN jsonb_build_object('success', true, 'report_id', v_report_id, 'message', 'تم دمج التقرير بنجاح مع فحص اليوم.');
        ELSE
            -- إنشاء تقرير جديد باستخدام الدومين الأساسي
            INSERT INTO public.reports_summary (score, report_date, api_key_id, platform_url, raw_report_data, pages_scanned)
            VALUES (p_score, now(), v_key_id, v_base_domain, p_report_data, jsonb_build_array(v_page_url))
            RETURNING id INTO v_report_id;

            INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
            VALUES (NULL, 'API_INSERT', 'reports_summary', 'New Report #' || v_report_id || ' via ' || v_key_name || ' for ' || v_base_domain);

            RETURN jsonb_build_object('success', true, 'report_id', v_report_id, 'message', 'تم استلام وحفظ التقرير بنجاح (موقع سعودي).');
        END IF;

    ELSE
        -- Log it as an ignored report
        INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
        VALUES (NULL, 'API_IGNORE', 'reports_summary', 'Ignored non-SA report for ' || p_platform_url);

        RETURN jsonb_build_object('success', true, 'message', 'تم الفحص. لم يتم الحفظ لأنه غير سعودي (.sa).');
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
