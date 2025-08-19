-- Fix profiles table RLS policies to prevent unauthorized access to customer emails
-- Drop existing policies that may have security gaps
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create secure, restrictive policies with explicit authentication checks
-- Only allow authenticated users to view their own profile
CREATE POLICY "authenticated_users_view_own_profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Only allow authenticated users to insert their own profile
CREATE POLICY "authenticated_users_insert_own_profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Only allow authenticated users to update their own profile
CREATE POLICY "authenticated_users_update_own_profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Explicitly deny all DELETE operations for security
-- (No DELETE policy = no one can delete, which is what we want)