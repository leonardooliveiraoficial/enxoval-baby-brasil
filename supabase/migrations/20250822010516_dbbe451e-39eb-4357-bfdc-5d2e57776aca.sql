-- Fix function search path security issue
-- Set search_path to public for all functions to prevent SQL injection

-- Fix get_mercadopago_config_status function
CREATE OR REPLACE FUNCTION public.get_mercadopago_config_status()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Return configuration status without exposing actual credentials
  SELECT json_build_object(
    'id', id,
    'created_at', created_at,
    'updated_at', updated_at,
    'has_access_token', CASE 
      WHEN access_token IS NOT NULL AND access_token != '' THEN true 
      ELSE false 
    END,
    'has_webhook_secret', CASE 
      WHEN webhook_secret IS NOT NULL AND webhook_secret != '' THEN true 
      ELSE false 
    END,
    'has_account_id', CASE 
      WHEN account_id IS NOT NULL AND account_id != '' THEN true 
      ELSE false 
    END,
    'account_id', account_id  -- Account ID is less sensitive, can be shown
  ) INTO result
  FROM public.mercadopago_settings 
  WHERE id = 1;
  
  RETURN COALESCE(result, '{"configured": false}'::json);
END;
$function$;

-- Fix update_mercadopago_config function
CREATE OR REPLACE FUNCTION public.update_mercadopago_config(p_account_id text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Update only the account_id field (non-sensitive)
  UPDATE public.mercadopago_settings 
  SET 
    account_id = COALESCE(p_account_id, account_id),
    updated_at = now()
  WHERE id = 1;
  
  -- Log the action for audit purposes
  INSERT INTO public.audit_logs (
    entity,
    entity_id,
    action,
    user_id,
    meta
  ) VALUES (
    'mercadopago_settings',
    '1'::uuid,
    'update_config',
    auth.uid(),
    json_build_object('field_updated', 'account_id', 'timestamp', now())
  );
  
  -- Return success status without sensitive data
  SELECT json_build_object(
    'success', true,
    'message', 'Configuration updated successfully'
  ) INTO result;
  
  RETURN result;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (
    NEW.id, 
    NEW.email,
    CASE 
      WHEN NEW.email = 'admin@admin.com' THEN 'admin'
      ELSE 'viewer'
    END
  );
  RETURN NEW;
END;
$function$;

-- Fix check_role_update_permission function
CREATE OR REPLACE FUNCTION public.check_role_update_permission()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;