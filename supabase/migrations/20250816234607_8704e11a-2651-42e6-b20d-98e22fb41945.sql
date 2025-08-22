-- Fix critical security vulnerability in orders table
-- Remove the overly permissive policy that allows public access to all order data
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;

-- Create restrictive policies that protect customer data
-- Only allow service role access for edge functions (payment processing)
CREATE POLICY "orders_service_role_all" ON public.orders
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Block all public access to sensitive order data
-- This ensures customer information cannot be stolen
CREATE POLICY "orders_no_public_access" ON public.orders
FOR ALL 
TO public
USING (false)
WITH CHECK (false);

-- Apply the same security fix to order_items table
DROP POLICY IF EXISTS "order_items_admin_all" ON public.order_items;

CREATE POLICY "order_items_service_role_all" ON public.order_items
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "order_items_no_public_access" ON public.order_items
FOR ALL 
TO public
USING (false)
WITH CHECK (false);