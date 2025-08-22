-- Remove admin read access to sensitive MercadoPago credentials
-- This addresses the security finding about payment credentials being accessible to admins

-- Drop the existing admin read policy
DROP POLICY IF EXISTS "Admins can read MercadoPago settings" ON public.mercadopago_settings;

-- Create a security definer function that returns config status without exposing credentials
CREATE OR REPLACE FUNCTION public.get_mercadopago_config_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create a security definer function for admins to update non-sensitive fields
CREATE OR REPLACE FUNCTION public.update_mercadopago_config(
  p_account_id text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Grant execute permissions to authenticated users (will be restricted by function logic)
GRANT EXECUTE ON FUNCTION public.get_mercadopago_config_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_mercadopago_config TO authenticated;