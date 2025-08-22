-- Add restrictive SELECT policy for mercadopago_settings table
-- This prevents unauthorized access to sensitive payment credentials

-- Drop any existing admin SELECT policies first (in case they exist)
DROP POLICY IF EXISTS "Admins can read MercadoPago settings" ON public.mercadopago_settings;

-- Create a restrictive SELECT policy that blocks direct access to sensitive credentials
-- Only allow access to non-sensitive fields and only for admin users
CREATE POLICY "Admins cannot directly read sensitive credentials" 
ON public.mercadopago_settings 
FOR SELECT 
USING (
  -- Only admin users can attempt to read
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
  -- But block access to sensitive credential fields by returning false
  -- This forces admins to use the secure functions instead
  AND false
);

-- Ensure RLS is enabled
ALTER TABLE public.mercadopago_settings ENABLE ROW LEVEL SECURITY;

-- Add a comment explaining the security approach
COMMENT ON POLICY "Admins cannot directly read sensitive credentials" ON public.mercadopago_settings IS 
'This policy blocks all direct SELECT access to prevent credential exposure. Use get_mercadopago_config_status() function instead.';