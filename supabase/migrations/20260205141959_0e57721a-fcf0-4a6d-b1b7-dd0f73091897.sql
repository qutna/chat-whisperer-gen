-- Drop the existing authenticated-only update policy
DROP POLICY IF EXISTS "Authenticated users can update impact rate settings" ON impact_rate_settings;

-- Create a new policy allowing anyone to update impact rate settings
CREATE POLICY "Anyone can update impact rate settings" 
  ON impact_rate_settings 
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);