-- Add RLS policies for business_cost_patterns table to secure business intelligence data

-- Allow authenticated users to read cost patterns (business intelligence should be available to paying users)
CREATE POLICY "Authenticated users can view cost patterns" 
ON public.business_cost_patterns 
FOR SELECT 
TO authenticated
USING (true);

-- Only allow service role to insert/update cost patterns (admin-only for data management)
CREATE POLICY "Service role can manage cost patterns" 
ON public.business_cost_patterns 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Prevent public access to cost patterns
DROP POLICY IF EXISTS "Allow public read access to cost patterns" ON public.business_cost_patterns;