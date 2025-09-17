-- Fix RLS security issue by enabling RLS on account_types table
ALTER TABLE public.account_types ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read account types (they are reference data)
CREATE POLICY "Authenticated users can view account types" 
ON public.account_types 
FOR SELECT 
USING (true);

-- Create policy to prevent modification of account types by regular users
-- Only service role should be able to modify these
CREATE POLICY "Service role can manage account types" 
ON public.account_types 
FOR ALL
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');