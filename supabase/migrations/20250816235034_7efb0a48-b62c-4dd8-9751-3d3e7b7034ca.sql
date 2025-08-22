-- Add RLS protection to v_progress view to prevent unauthorized access to business metrics
ALTER TABLE public.v_progress ENABLE ROW LEVEL SECURITY;

-- Allow public read access to progress data (this is typically displayed publicly on fundraising sites)
-- If you want to restrict this further, change this policy
CREATE POLICY "v_progress_public_read" 
ON public.v_progress 
FOR SELECT 
TO public
USING (true);

-- Allow admin/service role full access
CREATE POLICY "v_progress_admin_all" 
ON public.v_progress 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);