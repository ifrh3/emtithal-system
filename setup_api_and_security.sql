-- 1. Create API Keys table
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

-- 2. Create Activity Logs table (Audit Log)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    action_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Trigger Function for Activity Logs
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

-- Add triggers to tables
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.audit_log_trigger();

DROP TRIGGER IF EXISTS audit_api_keys ON public.api_keys;
CREATE TRIGGER audit_api_keys AFTER INSERT OR UPDATE OR DELETE ON public.api_keys FOR EACH ROW EXECUTE PROCEDURE public.audit_log_trigger();

-- 4. Enable RLS and setup roles
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

-- Ensure existing users have Full Access so we don't lock the developer out
UPDATE public.profiles SET role = 'Full Access' WHERE role IS NULL;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaints ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin Insert Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin Update Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin Delete Profiles" ON public.profiles;

DROP POLICY IF EXISTS "Public Read API Keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admin Insert API Keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admin Update API Keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admin Delete API Keys" ON public.api_keys;

DROP POLICY IF EXISTS "Public Read Logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Staff Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff Read API Keys" ON public.api_keys;
DROP POLICY IF EXISTS "Staff Insert API Keys" ON public.api_keys;
DROP POLICY IF EXISTS "Staff Update API Keys" ON public.api_keys;
DROP POLICY IF EXISTS "Full Access Read Logs" ON public.activity_logs;

DO $$
BEGIN
  IF to_regclass('public.reports_summary') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Public Read Report Summaries" ON public.reports_summary;
  END IF;

  IF to_regclass('public.complaints') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Staff Read Complaints" ON public.complaints;
    DROP POLICY IF EXISTS "Staff Update Complaints" ON public.complaints;
  END IF;
END $$;

-- Policies for profiles
CREATE POLICY "Staff Read Profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin Insert Profiles" ON public.profiles FOR INSERT WITH CHECK ( public.is_admin() );
CREATE POLICY "Admin Update Profiles" ON public.profiles FOR UPDATE USING ( public.is_admin() );
CREATE POLICY "Admin Delete Profiles" ON public.profiles FOR DELETE USING ( public.is_admin() );

-- Policies for API Keys
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
CREATE POLICY "Admin Delete API Keys" ON public.api_keys FOR DELETE USING ( public.is_admin() );

-- Policies for Activity Logs
CREATE POLICY "Full Access Read Logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

DO $$
BEGIN
  -- Public reports are intentionally readable, but report submission still goes through RPC.
  IF to_regclass('public.reports_summary') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Public Read Report Summaries" ON public.reports_summary FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  -- Complaints are staff-only operational data.
  IF to_regclass('public.complaints') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Staff Read Complaints" ON public.complaints FOR SELECT TO authenticated USING (public.has_staff_role(ARRAY[''Full Access'', ''Key Generator'', ''View Only'']::text[]))';
    EXECUTE 'CREATE POLICY "Staff Update Complaints" ON public.complaints FOR UPDATE TO authenticated USING (public.has_staff_role(ARRAY[''Full Access'', ''Key Generator'']::text[])) WITH CHECK (public.has_staff_role(ARRAY[''Full Access'', ''Key Generator'']::text[]))';
  END IF;
END $$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
