-- Drop the existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can update urban area settings" ON public.urban_area_settings;

-- Create a new policy allowing anyone to update
CREATE POLICY "Anyone can update urban area settings" 
ON public.urban_area_settings 
FOR UPDATE 
USING (true) 
WITH CHECK (true);