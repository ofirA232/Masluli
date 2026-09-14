-- Per-user travel preferences. Private to the owner; never exposed through
-- get_shared_trip. Edge functions read it under the caller's JWT (RLS).
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(preferences) = 'object' AND octet_length(preferences::text) <= 8192),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_owner_select ON public.profiles;
DROP POLICY IF EXISTS profiles_owner_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_owner_update ON public.profiles;
DROP POLICY IF EXISTS profiles_owner_delete ON public.profiles;
CREATE POLICY profiles_owner_select ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY profiles_owner_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY profiles_owner_update ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY profiles_owner_delete ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
CREATE OR REPLACE FUNCTION public.profiles_touch() RETURNS trigger
LANGUAGE plpgsql SET search_path = public, pg_catalog AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS profiles_touch ON public.profiles;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_touch();
