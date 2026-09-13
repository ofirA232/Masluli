\set ON_ERROR_STOP on
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
INSERT INTO public.trips(id, destination, trip_data, user_id, user_email) VALUES ('11111111-1111-4111-8111-111111111111', 'Paris', '{"version":2,"days":[],"metadata":{"title":"Paris"}}', auth.uid(), 'private@example.test');
SELECT * FROM public.save_trip('11111111-1111-4111-8111-111111111111', 0, 'Paris', '{"version":2,"days":[],"notes":"saved"}');
DO $$ BEGIN
 BEGIN PERFORM public.save_trip('11111111-1111-4111-8111-111111111111', 0, 'Paris', '{"version":2,"days":[]}'); RAISE EXCEPTION 'stale save accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN UPDATE public.trips SET trip_data = '{}' WHERE id = '11111111-1111-4111-8111-111111111111'; RAISE EXCEPTION 'direct update accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT public.create_share_link('11111111-1111-4111-8111-111111111111') AS token \gset
SELECT set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
DO $$ BEGIN
 IF EXISTS(SELECT FROM public.trips) THEN RAISE EXCEPTION 'other user can read trip'; END IF;
 BEGIN PERFORM public.save_trip('11111111-1111-4111-8111-111111111111', 1, 'Paris', '{"version":2,"days":[]}'); RAISE EXCEPTION 'other user can save'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN PERFORM public.create_share_link('11111111-1111-4111-8111-111111111111'); RAISE EXCEPTION 'other user can share'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
DO $$ BEGIN
 IF EXISTS(SELECT FROM public.get_shared_trip('invalid')) THEN RAISE EXCEPTION 'invalid share accepted'; END IF;
 BEGIN PERFORM * FROM public.trips; RAISE EXCEPTION 'anonymous table read accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT count(*) = 1 AND bool_and(NOT (to_jsonb(t) ?| ARRAY['user_id', 'user_email', 'share_token'])) AS valid_public_projection FROM public.get_shared_trip(:'token') t \gset
\if :valid_public_projection
\echo 'Shared projection passes'
\else
\quit 1
\endif
SET LOCAL ROLE service_role;
DO $$ BEGIN
 IF NOT public.consume_api_quota('test', 1, 60) THEN RAISE EXCEPTION 'first quota call blocked'; END IF;
 IF public.consume_api_quota('test', 1, 60) THEN RAISE EXCEPTION 'quota exceeded'; END IF;
END $$;
ROLLBACK;
\echo 'All permission, revision and quota tests passed'
