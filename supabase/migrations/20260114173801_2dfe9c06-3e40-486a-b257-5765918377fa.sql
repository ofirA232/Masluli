-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own trips" ON public.trips;

-- Create policy for public read access (anyone can view any trip - for sharing)
CREATE POLICY "Anyone can view trips (public sharing)" 
ON public.trips 
FOR SELECT 
USING (true);

-- Ensure only owners can delete their trips
DROP POLICY IF EXISTS "Block all deletes" ON public.trips;

CREATE POLICY "Users can delete own trips" 
ON public.trips 
FOR DELETE 
USING (auth.uid() = user_id);