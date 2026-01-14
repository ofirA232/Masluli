-- Create trips table for storing saved itineraries
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  destination TEXT NOT NULL,
  trip_data JSONB NOT NULL,
  user_email TEXT
);

-- Enable Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Create policy for public inserts (for now)
CREATE POLICY "Anyone can insert trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public select (to view shared trips)
CREATE POLICY "Anyone can view trips" 
ON public.trips 
FOR SELECT 
USING (true);

-- Create index on created_at for efficient sorting
CREATE INDEX idx_trips_created_at ON public.trips (created_at DESC);