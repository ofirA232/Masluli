-- A revision conflict is a business outcome, not a transaction failure.
-- SQLSTATE 40001 (serialization_failure) tells PostgREST to retry the
-- statement, which turned one stale save into an endless retry loop.
-- PT409 makes PostgREST answer HTTP 409 immediately.
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
  IF NOT FOUND THEN RAISE EXCEPTION 'trip_conflict_or_forbidden' USING ERRCODE = 'PT409'; END IF;
END $$;
