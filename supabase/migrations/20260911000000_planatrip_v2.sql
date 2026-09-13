-- Forward-only upgrade; also serves as the standalone fresh-install baseline.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(),
  destination text NOT NULL, trip_data jsonb NOT NULL, user_email text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, share_token text UNIQUE
);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
-- Rebuild policies to remove permissive legacy sharing policies.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trips' LOOP
    EXECUTE format('DROP POLICY %I ON public.trips', p.policyname);
  END LOOP;
END $$;
CREATE POLICY trips_owner_select ON public.trips FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY trips_owner_insert ON public.trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND revision = 0 AND share_token IS NULL);
CREATE POLICY trips_owner_delete ON public.trips FOR DELETE TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.trips FROM anon;
REVOKE UPDATE ON public.trips FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
CREATE INDEX IF NOT EXISTS planatrip_trips_owner ON public.trips(user_id);

CREATE OR REPLACE FUNCTION public.save_trip(p_id uuid, p_revision integer, p_destination text, p_data jsonb)
RETURNS TABLE(revision integer, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501'; END IF;
  IF length(p_destination) NOT BETWEEN 1 AND 100 OR octet_length(p_data::text) > 1048576 OR
    p_data->>'version' IS DISTINCT FROM '2' OR jsonb_typeof(p_data->'days') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'invalid trip' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY UPDATE public.trips t SET trip_data = p_data, destination = p_destination,
    revision = t.revision + 1, updated_at = now()
    WHERE t.id = p_id AND t.user_id = auth.uid() AND t.revision = p_revision
    RETURNING t.revision, t.updated_at;
  IF NOT FOUND THEN RAISE EXCEPTION 'trip_conflict_or_forbidden' USING ERRCODE = '40001'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.save_trip(uuid, integer, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_trip(uuid, integer, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_share_link(p_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_catalog AS $$
DECLARE result text;
BEGIN
  UPDATE public.trips SET share_token = coalesce(share_token, encode(extensions.gen_random_bytes(24), 'hex'))
    WHERE id = p_id AND user_id = auth.uid() RETURNING share_token INTO result;
  IF result IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.create_share_link(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_share_link(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.get_shared_trip(text);
CREATE FUNCTION public.get_shared_trip(token text)
RETURNS TABLE(id uuid, destination text, trip_data jsonb, created_at timestamptz, revision integer, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT t.id, t.destination,
    jsonb_build_object('version', t.trip_data->'version', 'metadata', t.trip_data->'metadata',
      'days', t.trip_data->'days', 'saved_places', t.trip_data->'saved_places',
      'expenses', t.trip_data->'expenses', 'notes', t.trip_data->'notes', 'cover', t.trip_data->'cover'),
    t.created_at, t.revision, t.updated_at
  FROM public.trips t WHERE t.share_token IS NOT NULL AND t.share_token = token;
$$;
REVOKE ALL ON FUNCTION public.get_shared_trip(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_trip(text) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.api_usage (
  scope text NOT NULL, bucket bigint NOT NULL, count integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL, PRIMARY KEY(scope, bucket)
);
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_usage FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.consume_api_quota(p_scope text, p_limit integer, p_window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE b bigint; total integer;
BEGIN
  IF p_limit < 1 OR p_window_seconds < 1 THEN RETURN false; END IF;
  b := floor(extract(epoch FROM now()) / p_window_seconds);
  INSERT INTO public.api_usage(scope, bucket, count, expires_at)
    VALUES(p_scope, b, 1, to_timestamp((b + 1) * p_window_seconds))
    ON CONFLICT(scope, bucket) DO UPDATE SET count = api_usage.count + 1
    RETURNING count INTO total;
  DELETE FROM public.api_usage WHERE scope = p_scope AND expires_at < now() - interval '1 day';
  RETURN total <= p_limit;
END $$;
REVOKE ALL ON FUNCTION public.consume_api_quota(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_api_quota(text, integer, integer) TO service_role;
-- Supabase default privileges grant EXECUTE on new public functions to anon/authenticated explicitly;
-- REVOKE FROM PUBLIC alone does not remove those grants, so revoke them by name.
REVOKE EXECUTE ON FUNCTION public.consume_api_quota(text, integer, integer) FROM anon, authenticated;
