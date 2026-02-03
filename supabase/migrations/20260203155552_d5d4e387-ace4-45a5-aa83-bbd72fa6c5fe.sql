-- Fix the function with explicit schema reference for gen_random_bytes
DROP FUNCTION IF EXISTS public.generate_share_token();

CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_catalog
AS $$
BEGIN
  RETURN encode(extensions.gen_random_bytes(16), 'hex');
END;
$$;