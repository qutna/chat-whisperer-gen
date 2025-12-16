-- Create table for rush hour settings
CREATE TABLE public.rush_hour_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  morning_start time DEFAULT '07:00',
  morning_end time DEFAULT '09:00',
  evening_start time DEFAULT '16:00',
  evening_end time DEFAULT '18:00',
  is_enabled boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Enable RLS
ALTER TABLE public.rush_hour_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rush hour settings"
ON public.rush_hour_settings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update rush hour settings"
ON public.rush_hour_settings FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert rush hour settings"
ON public.rush_hour_settings FOR INSERT TO authenticated
WITH CHECK (true);

-- Insert defaults (0=Sunday, 1=Monday, etc.)
INSERT INTO public.rush_hour_settings (day_of_week, morning_start, morning_end, evening_start, evening_end, is_enabled) VALUES
(0, '07:00', '09:00', '16:00', '18:00', false),  -- Sunday
(1, '07:00', '09:00', '16:00', '18:00', true),   -- Monday
(2, '07:00', '09:00', '16:00', '18:00', true),   -- Tuesday
(3, '07:00', '09:00', '16:00', '18:00', true),   -- Wednesday
(4, '07:00', '09:00', '16:00', '18:00', true),   -- Thursday
(5, '07:00', '09:00', '16:00', '18:00', true),   -- Friday
(6, '07:00', '09:00', '16:00', '18:00', false);  -- Saturday

-- Create table for urban area definition
CREATE TABLE public.urban_area_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'default',
  polygon jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(name)
);

-- Enable RLS
ALTER TABLE public.urban_area_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read urban area settings"
ON public.urban_area_settings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update urban area settings"
ON public.urban_area_settings FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert urban area settings"
ON public.urban_area_settings FOR INSERT TO authenticated
WITH CHECK (true);

-- Insert default Copenhagen urban boundary
INSERT INTO public.urban_area_settings (name, polygon) VALUES
('default', '{"type": "Polygon", "coordinates": [[[12.52, 55.715], [12.555, 55.72], [12.585, 55.715], [12.61, 55.7], [12.62, 55.68], [12.615, 55.66], [12.6, 55.645], [12.58, 55.635], [12.55, 55.63], [12.52, 55.635], [12.495, 55.65], [12.49, 55.67], [12.5, 55.69], [12.52, 55.715]]]}');