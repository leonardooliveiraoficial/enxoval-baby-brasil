-- Fix security vulnerabilities in RLS policies

-- Drop existing problematic policies for profiles table
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Drop existing problematic policies for audit_logs table  
DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;

-- Create secure policies for profiles table
-- Only authenticated users can read their own profile
CREATE POLICY "Users can read own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Only authenticated users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated  
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role can manage all profiles (for triggers and admin functions)
CREATE POLICY "Service role can manage all profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create secure policies for audit_logs table
-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Service role can manage audit logs (for logging functions)
CREATE POLICY "Service role can manage audit logs" 
ON public.audit_logs
FOR ALL
TO service_role  
USING (true)
WITH CHECK (true);

-- Ensure both tables have RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;