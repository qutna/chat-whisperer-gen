-- Allow deleting incentives
CREATE POLICY "Anyone can delete incentives"
ON public.incentives
FOR DELETE
USING (true);

-- Allow updating incentives
CREATE POLICY "Anyone can update incentives"
ON public.incentives
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow inserting incentives
CREATE POLICY "Anyone can insert incentives"
ON public.incentives
FOR INSERT
WITH CHECK (true);