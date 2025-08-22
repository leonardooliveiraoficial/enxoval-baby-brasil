-- Drop the existing problematic view
DROP VIEW IF EXISTS public.v_progress;

-- Create a corrected view without SECURITY DEFINER requirement
CREATE VIEW public.v_progress AS
WITH raised_total AS (
  SELECT COALESCE(SUM(amount_cents), 0) AS raised_cents
  FROM orders 
  WHERE status = 'paid'
),
goal_total AS (
  SELECT COALESCE(SUM(price_cents * target_qty), 0) AS goal_cents
  FROM products 
  WHERE is_active = true
)
SELECT 
  raised_total.raised_cents::bigint,
  goal_total.goal_cents::bigint
FROM raised_total, goal_total;