-- Fix admin-products edge function by updating the admin-products table access
-- Ensure the admin role has proper access to all necessary tables

-- Update RLS policies for products table to allow admin operations via service role
CREATE POLICY "Service role can manage all products" ON public.products
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Update RLS policies for categories table to allow admin operations via service role  
CREATE POLICY "Service role can manage all categories" ON public.categories
FOR ALL
TO service_role 
USING (true)
WITH CHECK (true);