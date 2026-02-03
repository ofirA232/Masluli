-- Drop the dangerous public SELECT policy
DROP POLICY IF EXISTS "Anyone can view trips (public sharing)" ON public.trips;

-- Add share_token column for secure sharing
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Create a function to generate share tokens
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT encode(gen_random_bytes(16), 'hex')
$$;

-- Create owner-only SELECT policy (users can always view their own trips)
CREATE POLICY "Users can view own trips" 
ON public.trips 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for shared trips (anyone with valid share token can view)
CREATE POLICY "Anyone can view trips with share token" 
ON public.trips 
FOR SELECT 
USING (
  share_token IS NOT NULL AND 
  share_token = current_setting('request.query.share_token', true)
);

-- Allow users to update their own trips (for generating share tokens)
DROP POLICY IF EXISTS "Block all updates" ON public.trips;

CREATE POLICY "Users can update own trips" 
ON public.trips 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);