-- Fix critical security vulnerability in mercadopago_settings table
-- Payment credentials must be protected from unauthorized access

-- Drop existing policy that may allow public access
DROP POLICY IF EXISTS "Admins can manage MercadoPago settings" ON public.mercadopago_settings;

-- Create secure policies for mercadopago_settings table
-- Only authenticated admin users can read payment settings
CREATE POLICY "Admins can read MercadoPago settings"
ON public.mercadopago_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only authenticated admin users can update payment settings
CREATE POLICY "Admins can update MercadoPago settings"
ON public.mercadopago_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only authenticated admin users can insert payment settings
CREATE POLICY "Admins can insert MercadoPago settings"
ON public.mercadopago_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Service role can manage payment settings (for edge functions)
CREATE POLICY "Service role can manage MercadoPago settings"
ON public.mercadopago_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled on the table
ALTER TABLE public.mercadopago_settings ENABLE ROW LEVEL SECURITY;