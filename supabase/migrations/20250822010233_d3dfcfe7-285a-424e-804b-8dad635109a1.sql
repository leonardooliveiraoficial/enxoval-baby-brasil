-- Fix profile role security: prevent users from updating their own role
-- Only allow service role to modify user roles

-- Drop existing policy for profile updates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new restrictive update policy that excludes role changes
CREATE POLICY "Users can update own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (
    -- Allow users to update all fields except role
    (OLD.role = NEW.role) OR 
    -- Only service role can change roles
    (current_setting('role') = 'service_role')
  )
);

-- Ensure only service role can insert profiles with specific roles
CREATE POLICY "Service role can manage profile roles"
ON public.profiles
FOR ALL
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- Create audit function for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes for security monitoring
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_logs (
      entity,
      entity_id,
      action,
      user_id,
      meta
    ) VALUES (
      'profiles',
      NEW.user_id,
      'role_change',
      auth.uid(),
      json_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'timestamp', now(),
        'session_role', current_setting('role')
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change auditing
CREATE TRIGGER audit_profile_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();