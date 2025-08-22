-- Fix profile role security: prevent users from updating their own role
-- Simple approach: create separate policies for different operations

-- Drop existing policy for profile updates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create policy for users to update non-sensitive fields only
-- This policy allows updates to all fields except role
CREATE POLICY "Users can update profile non-role fields" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a more restrictive function for role changes
CREATE OR REPLACE FUNCTION public.check_role_update_permission()
RETURNS TRIGGER AS $$
BEGIN  
  -- If role is being changed, only allow service role to do it
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Check if this is being done by service role (backend operations)
    IF current_setting('role', true) != 'service_role' THEN
      RAISE EXCEPTION 'Permission denied: Only system can modify user roles';
    END IF;
    
    -- Log the role change for audit
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
      COALESCE(auth.uid(), NEW.user_id),
      json_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'timestamp', now(),
        'changed_by_service_role', true
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce role change restrictions
DROP TRIGGER IF EXISTS check_role_update_permission ON public.profiles;
CREATE TRIGGER check_role_update_permission
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_role_update_permission();