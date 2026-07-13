-- Fix shared-trip access.
--
-- The previous share-token RLS policy compared
--   share_token = current_setting('request.query.share_token', true)
-- but PostgREST never populates request.query.*, so the policy never matched
-- and share links returned "not found" for everyone except the owner.
--
-- Replace it with a SECURITY DEFINER function that looks a trip up by its
-- unguessable share token, bypassing RLS safely for that single lookup.

-- Drop the non-functional policy.
DROP POLICY IF EXISTS "Anyone can view trips with share token" ON public.trips;

CREATE OR REPLACE FUNCTION public.get_shared_trip(token TEXT)
RETURNS SETOF public.trips
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT *
  FROM public.trips
  WHERE share_token IS NOT NULL
    AND share_token = token;
$$;

-- Allow both anonymous and authenticated visitors to resolve a share link.
GRANT EXECUTE ON FUNCTION public.get_shared_trip(TEXT) TO anon, authenticated;
