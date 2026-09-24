-- Google Places content cached inside a trip (name, address, rating, hours,
-- links, photo) may be kept for up to 30 days to spare repeat calls, and must
-- then be deleted or refreshed. Opening a trip refreshes it; this removes it
-- from trips nobody opened in time. Place IDs and the traveller's own data are
-- never touched.

-- A timestamp that may be malformed: null instead of an error.
CREATE OR REPLACE FUNCTION public.safe_timestamptz(value text)
RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN value::timestamptz;
EXCEPTION WHEN others THEN
  RETURN NULL;
END $$;

-- The same stop list with every Google cache older than the cutoff (or of
-- unknown age) removed. Order and every other field are preserved.
CREATE OR REPLACE FUNCTION public.strip_expired_google(stops jsonb, cutoff timestamptz)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(jsonb_agg(
           CASE
             WHEN jsonb_typeof(stop) = 'object'
              AND stop ? 'google'
              AND coalesce(public.safe_timestamptz(stop->'google'->>'fetched_at') >= cutoff, false) = false
             THEN stop - 'google'
             ELSE stop
           END ORDER BY position), '[]'::jsonb)
  FROM jsonb_array_elements(
         CASE WHEN jsonb_typeof(stops) = 'array' THEN stops ELSE '[]'::jsonb END
       ) WITH ORDINALITY AS list(stop, position)
$$;

CREATE OR REPLACE FUNCTION public.purge_expired_place_cache()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE
  cutoff timestamptz := now() - interval '30 days';
  changed integer;
BEGIN
  WITH cleaned AS (
    SELECT t.id,
      CASE WHEN t.trip_data ? 'saved_places'
        THEN jsonb_set(days_cleaned, '{saved_places}',
               public.strip_expired_google(t.trip_data->'saved_places', cutoff))
        ELSE days_cleaned
      END AS data
    FROM public.trips t,
    LATERAL (
      SELECT CASE WHEN jsonb_typeof(t.trip_data->'days') = 'array'
        THEN jsonb_set(t.trip_data, '{days}', (
          SELECT coalesce(jsonb_agg(
                   CASE WHEN jsonb_typeof(day) = 'object' AND day ? 'activities'
                     THEN jsonb_set(day, '{activities}',
                            public.strip_expired_google(day->'activities', cutoff))
                     ELSE day
                   END ORDER BY position), '[]'::jsonb)
          FROM jsonb_array_elements(t.trip_data->'days') WITH ORDINALITY AS list(day, position)))
        ELSE t.trip_data
      END AS days_cleaned
    ) AS d
    -- Only trips that hold a cache at all are rewritten.
    WHERE t.trip_data::text LIKE '%"fetched_at"%'
  )
  -- revision is left alone on purpose: bumping it would make a traveller with
  -- the trip open see a save conflict for a change they did not make. If that
  -- tab saves its older copy, the next run removes the stale cache again.
  UPDATE public.trips t SET trip_data = cleaned.data
  FROM cleaned
  WHERE t.id = cleaned.id AND t.trip_data IS DISTINCT FROM cleaned.data;
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed;
END $$;
REVOKE ALL ON FUNCTION public.purge_expired_place_cache() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purge_expired_place_cache() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_place_cache() TO service_role;

-- Run daily when pg_cron is available (Database -> Extensions in Supabase).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'purge-expired-place-cache', '17 3 * * *',
      'SELECT public.purge_expired_place_cache()'
    );
  ELSE
    RAISE NOTICE 'pg_cron is not enabled. Enable it, then run: SELECT cron.schedule(''purge-expired-place-cache'', ''17 3 * * *'', ''SELECT public.purge_expired_place_cache()'');';
  END IF;
END $$;
