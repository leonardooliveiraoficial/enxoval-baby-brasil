-- Fix security definer view issue by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.v_progress;

CREATE OR REPLACE VIEW public.v_progress AS
SELECT 
  COALESCE(SUM(o.amount_cents), 0) as raised_cents,
  COALESCE(SUM(p.price_cents * p.target_qty), 0) as goal_cents
FROM public.orders o
FULL OUTER JOIN public.products p ON p.is_active = true
WHERE o.status = 'paid' OR o.status IS NULL;

-- Fix function search path by setting it explicitly
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;