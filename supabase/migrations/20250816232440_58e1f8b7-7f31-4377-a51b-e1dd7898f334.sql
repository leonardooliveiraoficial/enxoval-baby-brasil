-- Drop triggers first, then function, then recreate with proper search_path
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_story_updated_at ON public.story_content;
DROP TRIGGER IF EXISTS update_thankyou_updated_at ON public.thankyou_template;

-- Drop the function
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Recreate function with proper search_path
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

-- Recreate triggers
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_story_updated_at
  BEFORE UPDATE ON public.story_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_thankyou_updated_at
  BEFORE UPDATE ON public.thankyou_template
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();