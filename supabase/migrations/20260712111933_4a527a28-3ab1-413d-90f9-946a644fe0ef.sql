-- Create trips table
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  destination TEXT NOT NULL,
  trip_data JSONB NOT NULL,
  user_email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE
);

CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_created_at ON public.trips(created_at DESC);
CREATE INDEX idx_trips_share_token ON public.trips(share_token) WHERE share_token IS NOT NULL;

GRANT SELECT ON public.trips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips"
ON public.trips FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view trips with share token"
ON public.trips FOR SELECT
USING (
  share_token IS NOT NULL
  AND share_token = current_setting('request.query.share_token', true)
);

CREATE POLICY "Users can insert own trips"
ON public.trips FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
ON public.trips FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
ON public.trips FOR DELETE
USING (auth.uid() = user_id);

-- Share token generator
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions, pg_catalog
AS $$
BEGIN
  RETURN encode(extensions.gen_random_bytes(16), 'hex');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_share_token() TO authenticated;