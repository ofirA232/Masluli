\set ON_ERROR_STOP on
DO $$ BEGIN
 IF (SELECT trip_data #>> '{days,0,activities,0,price}' FROM public.trips WHERE id='44444444-4444-4444-8444-444444444444') IS DISTINCT FROM 'about 20 EUR' THEN RAISE EXCEPTION 'legacy data changed'; END IF;
 IF EXISTS(SELECT FROM pg_policies WHERE tablename='trips' AND policyname='legacy_public_read') THEN RAISE EXCEPTION 'legacy policy survived'; END IF;
 IF NOT EXISTS(SELECT FROM public.get_shared_trip('legacy-share')) THEN RAISE EXCEPTION 'legacy share broke'; END IF;
END $$;
SET ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM * FROM public.trips; RAISE EXCEPTION 'anonymous read allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DELETE FROM public.trips WHERE id='44444444-4444-4444-8444-444444444444';
\echo 'Legacy rows and links preserved; permissive policies removed'
