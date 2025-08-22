-- Remove admin read access to sensitive MercadoPago credentials
-- This addresses the security finding about payment credentials being accessible to admins

-- Drop the existing admin read policy
DROP POLICY IF EXISTS "Admins can read MercadoPago settings" ON public.mercadopago_settings;

-- Create a secure view that shows configuration status without exposing credentials
CREATE OR REPLACE VIEW public.v_mercadopago_config_status AS
SELECT 
  id,
  created_at,
  updated_at,
  CASE 
    WHEN access_token IS NOT NULL AND access_token != '' THEN true 
    ELSE false 
  END as has_access_token,
  CASE 
    WHEN webhook_secret IS NOT NULL AND webhook_secret != '' THEN true 
    ELSE false 
  END as has_webhook_secret,
  CASE 
    WHEN account_id IS NOT NULL AND account_id != '' THEN true 
    ELSE false 
  END as has_account_id
FROM public.mercadopago_settings;

-- Enable RLS on the view
ALTER VIEW public.v_mercadopago_config_status OWNER TO postgres;

-- Create RLS policies for the secure view
CREATE POLICY "Admins can view MercadoPago config status" ON public.v_mercadopago_config_status
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

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
  
  -- Return success status without sensitive data
  SELECT json_build_object(
    'success', true,
    'message', 'Configuration updated successfully'
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_mercadopago_config TO authenticated;

-- Create audit logging function for sensitive credential access
CREATE OR REPLACE FUNCTION public.log_mercadopago_access(
  action_type text,
  details text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    entity,
    entity_id,
    action,
    user_id,
    meta
  ) VALUES (
    'mercadopago_settings',
    '1'::uuid,
    action_type,
    auth.uid(),
    json_build_object('details', details, 'timestamp', now())
  );
END;
$$;