-- Create account_settings table for configurable settings like lock threshold
CREATE TABLE public.account_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read account settings"
ON public.account_settings
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can update account settings"
ON public.account_settings
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can insert account settings"
ON public.account_settings
FOR INSERT
WITH CHECK (true);

-- Insert default lock threshold (90 days)
INSERT INTO public.account_settings (setting_key, setting_value, description)
VALUES ('incentive_lock_threshold_days', '90', 'Number of days before incentive start date when editing is locked');