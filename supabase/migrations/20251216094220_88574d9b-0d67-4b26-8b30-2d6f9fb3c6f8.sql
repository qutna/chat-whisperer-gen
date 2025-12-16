-- Create table for custom impact rates
CREATE TABLE public.impact_rate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL UNIQUE,
  space_urban numeric NOT NULL,
  space_suburban numeric NOT NULL,
  congestion_rush numeric NOT NULL,
  congestion_non_rush numeric NOT NULL,
  co2 numeric NOT NULL,
  access numeric NOT NULL,
  health numeric NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.impact_rate_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read impact rate settings"
ON public.impact_rate_settings
FOR SELECT
USING (true);

-- Only authenticated users can update (for now - can add admin check later)
CREATE POLICY "Authenticated users can update impact rate settings"
ON public.impact_rate_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can insert impact rate settings"
ON public.impact_rate_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert default values
INSERT INTO public.impact_rate_settings (mode, space_urban, space_suburban, congestion_rush, congestion_non_rush, co2, access, health) VALUES
('car', -1.0, -0.5, -0.8, -0.2, -0.1, 0.2, -1.0),
('bus', -0.2, -0.1, -0.2, -0.1, -0.002, 0.2, -0.1),
('rail', -0.02, -0.01, 0, 0, -0.001, 0.2, 0),
('walking', 0.02, 0.02, 0, 0, -0.0001, 0.2, 1.5),
('cycling', -0.01, -0.005, 0, 0, -0.005, 0.2, 1.0),
('scooter_moped', -0.01, -0.005, 0, 0, -0.015, 0.2, -0.2),
('new_trip', -0.01, -0.005, 0, 0, -0.005, 0.2, 1.0),
('bike', -0.01, -0.005, 0, 0, -0.005, 0.2, 1.0);