-- Create trips table for MDS trip data
CREATE TABLE public.trips (
  trip_id UUID PRIMARY KEY,
  provider_id UUID NOT NULL,
  provider_name TEXT NOT NULL,
  device_id UUID NOT NULL,
  vehicle_type TEXT NOT NULL,
  propulsion_types TEXT[] NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  trip_duration INTEGER NOT NULL,
  trip_distance INTEGER NOT NULL,
  route JSONB NOT NULL,
  start_location JSONB NOT NULL,
  end_location JSONB NOT NULL,
  accuracy INTEGER NOT NULL,
  standard_cost NUMERIC,
  actual_cost NUMERIC,
  currency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can view the mockup data)
CREATE POLICY "Anyone can view trips"
  ON public.trips
  FOR SELECT
  USING (true);

-- Only allow inserts from service role (edge functions)
CREATE POLICY "Service role can insert trips"
  ON public.trips
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX idx_trips_start_time ON public.trips(start_time);
CREATE INDEX idx_trips_provider_name ON public.trips(provider_name);
CREATE INDEX idx_trips_propulsion_types ON public.trips USING GIN(propulsion_types);