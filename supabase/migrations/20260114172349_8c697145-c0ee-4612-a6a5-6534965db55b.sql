-- Add user_id column to link trips to authenticated users
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for efficient user_id queries
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view trips" ON public.trips;

-- Drop the overly permissive INSERT policy  
DROP POLICY IF EXISTS "Anyone can insert trips" ON public.trips;

-- Create owner-scoped SELECT policy
-- Users can view their own trips
CREATE POLICY "Users can view own trips" 
ON public.trips 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create owner-scoped INSERT policy
-- Users can only insert trips linked to their user_id
CREATE POLICY "Users can insert own trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Block all UPDATE operations (trips are immutable for now)
CREATE POLICY "Block all updates" 
ON public.trips 
FOR UPDATE 
USING (false);

-- Block all DELETE operations (trips cannot be deleted for now)
CREATE POLICY "Block all deletes" 
ON public.trips 
FOR DELETE 
USING (false);