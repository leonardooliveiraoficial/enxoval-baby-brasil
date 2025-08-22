-- Create profiles table for user roles
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')) DEFAULT 'viewer',
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all profiles"
ON public.profiles
FOR ALL
USING (true)
WITH CHECK (true);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit logs
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Service role can manage audit logs"
ON public.audit_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create products storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for products bucket
CREATE POLICY "Admin can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin can update product images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin can delete product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'products'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

-- Create view for admin dashboard stats
CREATE OR REPLACE VIEW public.v_admin_stats AS
SELECT 
  (SELECT COALESCE(SUM(amount_cents), 0) FROM orders WHERE status = 'paid') as total_raised_cents,
  (SELECT COALESCE(SUM(price_cents * target_qty), 0) FROM products WHERE is_active = true) as total_goal_cents,
  (SELECT COUNT(*) FROM products WHERE is_active = true AND purchased_qty >= target_qty) as completed_products,
  (SELECT COUNT(*) FROM orders WHERE status = 'paid') as paid_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'failed') as failed_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
  (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products;

-- Create view for daily sales
CREATE OR REPLACE VIEW public.v_daily_sales AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as orders_count,
  SUM(amount_cents) as total_cents
FROM orders 
WHERE status = 'paid' 
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Update triggers for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();