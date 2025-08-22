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
    -- Allow users to update all fields except role by checking if role hasn't changed
    -- This comparison will be done during the actual UPDATE operation
    OLD.role IS NOT DISTINCT FROM NEW.role
  )
);

-- Create audit function for role changes (simplified)
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes for security monitoring
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
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
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_profile_role_changes ON public.profiles;
CREATE TRIGGER audit_profile_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();