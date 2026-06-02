-- Emtithal website Supabase safety/update migration
-- Safe to run from Supabase SQL Editor. It avoids dropping or truncating existing data.

-- 1) Staff/API key support tables
CREATE TABLE IF NOT EXISTS public.api_keys (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active',
    quota INTEGER DEFAULT 10000,
    requests INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    action_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2) Helpers and audit logs
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
        VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id::text);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
        VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id::text);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
        VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id::text);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Full Access'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_staff_role(p_roles text[])
RETURNS boolean AS $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = ANY(p_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    UPDATE public.profiles SET role = 'Full Access' WHERE role IS NULL;

    DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
    CREATE TRIGGER audit_profiles
      AFTER INSERT OR UPDATE OR DELETE ON public.profiles
      FOR EACH ROW EXECUTE PROCEDURE public.audit_log_trigger();
  END IF;

  DROP TRIGGER IF EXISTS audit_api_keys ON public.api_keys;
  CREATE TRIGGER audit_api_keys
    AFTER INSERT OR UPDATE OR DELETE ON public.api_keys
    FOR EACH ROW EXECUTE PROCEDURE public.audit_log_trigger();
END $$;

-- 3) Reports table columns used by the browser extensions
DO $$
BEGIN
  IF to_regclass('public.reports_summary') IS NOT NULL THEN
    ALTER TABLE public.reports_summary ADD COLUMN IF NOT EXISTS api_key_id INT REFERENCES public.api_keys(id);
    ALTER TABLE public.reports_summary ADD COLUMN IF NOT EXISTS platform_url TEXT;
    ALTER TABLE public.reports_summary ADD COLUMN IF NOT EXISTS raw_report_data JSONB;
    ALTER TABLE public.reports_summary ADD COLUMN IF NOT EXISTS pages_scanned JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 4) Extension download counter support
DO $$
BEGIN
  IF to_regclass('public.extensions') IS NOT NULL THEN
    ALTER TABLE public.extensions ADD COLUMN IF NOT EXISTS downloads INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.increment_extension_download(p_id integer)
RETURNS void AS $$
BEGIN
    UPDATE public.extensions
    SET downloads = COALESCE(downloads, 0) + 1
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.increment_extension_download(integer) TO anon, authenticated;

-- 5) RPC used by the browser extensions to submit automated reports
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
    v_report_id text;
    v_page_url text;
    v_base_domain text;
BEGIN
    SELECT id, name, quota, requests INTO v_key_id, v_key_name, v_quota, v_requests
    FROM public.api_keys
    WHERE key = p_api_key AND status = 'active';

    IF v_key_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or inactive API Key.';
    END IF;

    IF v_requests >= v_quota THEN
        RAISE EXCEPTION 'API Key quota exceeded.';
    END IF;

    UPDATE public.api_keys
    SET requests = requests + 1, last_used = now()
    WHERE id = v_key_id;

    v_page_url := p_report_data->>'pageUrl';
    IF v_page_url IS NULL THEN
        v_page_url := p_platform_url;
    END IF;

    v_base_domain := substring(p_platform_url from '^(?:https?:\/\/)?(?:www\.)?([^\/]+)');
    IF v_base_domain IS NULL THEN
        v_base_domain := p_platform_url;
    END IF;

    IF v_base_domain ILIKE '%.sa%' THEN
        INSERT INTO public.reports_summary (score, report_date, api_key_id, platform_url, raw_report_data, pages_scanned)
        VALUES (p_score, now(), v_key_id, v_base_domain, p_report_data, jsonb_build_array(v_page_url))
        RETURNING id::text INTO v_report_id;

        INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
        VALUES (NULL, 'API_INSERT', 'reports_summary', 'New Report #' || v_report_id || ' via ' || v_key_name || ' for ' || v_base_domain);

        RETURN jsonb_build_object('success', true, 'report_id', v_report_id, 'message', 'تم استلام وحفظ التقرير بنجاح (موقع سعودي).');
    ELSE
        INSERT INTO public.activity_logs (user_id, action_type, table_name, record_id)
        VALUES (NULL, 'API_IGNORE', 'reports_summary', 'Ignored non-SA report for ' || p_platform_url);

        RETURN jsonb_build_object('success', true, 'message', 'تم الفحص. لم يتم الحفظ لأنه غير سعودي (.sa).');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.submit_audit_report(text, text, jsonb, numeric) TO anon, authenticated;

-- 6) Row-level security and policies
-- Recreate role helpers immediately before policies so this section can be rerun safely.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Full Access'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_staff_role(p_roles text[])
RETURNS boolean AS $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = ANY(p_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
  EXECUTE $sql$
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS boolean AS $fn$
    BEGIN
      IF to_regclass('public.profiles') IS NULL THEN
        RETURN false;
      END IF;

      RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'Full Access'
      );
    END;
    $fn$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  $sql$;

  EXECUTE $sql$
    CREATE OR REPLACE FUNCTION public.has_staff_role(p_roles text[])
    RETURNS boolean AS $fn$
    BEGIN
      IF to_regclass('public.profiles') IS NULL THEN
        RETURN false;
      END IF;

      RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = ANY(p_roles)
      );
    END;
    $fn$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  $sql$;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Staff Read Profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admin Insert Profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admin Update Profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admin Delete Profiles" ON public.profiles;

    CREATE POLICY "Staff Read Profiles" ON public.profiles
      FOR SELECT TO authenticated
      USING (id = auth.uid() OR public.is_admin());
    CREATE POLICY "Admin Insert Profiles" ON public.profiles
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin());
    CREATE POLICY "Admin Update Profiles" ON public.profiles
      FOR UPDATE TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
    CREATE POLICY "Admin Delete Profiles" ON public.profiles
      FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;

  ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Public Read API Keys" ON public.api_keys;
  DROP POLICY IF EXISTS "Staff Read API Keys" ON public.api_keys;
  DROP POLICY IF EXISTS "Admin Insert API Keys" ON public.api_keys;
  DROP POLICY IF EXISTS "Staff Insert API Keys" ON public.api_keys;
  DROP POLICY IF EXISTS "Admin Update API Keys" ON public.api_keys;
  DROP POLICY IF EXISTS "Staff Update API Keys" ON public.api_keys;
  DROP POLICY IF EXISTS "Admin Delete API Keys" ON public.api_keys;

  CREATE POLICY "Staff Read API Keys" ON public.api_keys
    FOR SELECT TO authenticated
    USING (public.has_staff_role(ARRAY['Full Access', 'Key Generator']::text[]));
  CREATE POLICY "Staff Insert API Keys" ON public.api_keys
    FOR INSERT TO authenticated
    WITH CHECK (public.has_staff_role(ARRAY['Full Access', 'Key Generator']::text[]));
  CREATE POLICY "Staff Update API Keys" ON public.api_keys
    FOR UPDATE TO authenticated
    USING (public.has_staff_role(ARRAY['Full Access', 'Key Generator']::text[]))
    WITH CHECK (public.has_staff_role(ARRAY['Full Access', 'Key Generator']::text[]));
  CREATE POLICY "Admin Delete API Keys" ON public.api_keys
    FOR DELETE TO authenticated
    USING (public.is_admin());

  ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Public Read Logs" ON public.activity_logs;
  DROP POLICY IF EXISTS "Full Access Read Logs" ON public.activity_logs;
  CREATE POLICY "Full Access Read Logs" ON public.activity_logs
    FOR SELECT TO authenticated
    USING (public.is_admin());

  IF to_regclass('public.reports_summary') IS NOT NULL THEN
    ALTER TABLE public.reports_summary ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Read Report Summaries" ON public.reports_summary;
    CREATE POLICY "Public Read Report Summaries" ON public.reports_summary
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;

  IF to_regclass('public.complaints') IS NOT NULL THEN
    ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Staff Read Complaints" ON public.complaints;
    DROP POLICY IF EXISTS "Staff Update Complaints" ON public.complaints;
    CREATE POLICY "Staff Read Complaints" ON public.complaints
      FOR SELECT TO authenticated
      USING (public.has_staff_role(ARRAY['Full Access', 'Key Generator', 'View Only']::text[]));
    CREATE POLICY "Staff Update Complaints" ON public.complaints
      FOR UPDATE TO authenticated
      USING (public.has_staff_role(ARRAY['Full Access', 'Key Generator']::text[]))
      WITH CHECK (public.has_staff_role(ARRAY['Full Access', 'Key Generator']::text[]));
  END IF;

  IF to_regclass('public.extensions') IS NOT NULL THEN
    ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Read Extensions" ON public.extensions;
    CREATE POLICY "Public Read Extensions" ON public.extensions
      FOR SELECT TO anon, authenticated
      USING (true);
    GRANT SELECT ON public.extensions TO anon, authenticated;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
