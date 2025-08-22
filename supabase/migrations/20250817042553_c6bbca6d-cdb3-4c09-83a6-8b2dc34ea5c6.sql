-- Update auth configuration for security improvements

-- Set shorter OTP expiry (24 hours instead of default)
UPDATE auth.config 
SET 
    otp_exp = 86400
WHERE 
    id = 1;

-- If the config table doesn't exist or the row doesn't exist, insert it
INSERT INTO auth.config (
    id,
    otp_exp
) VALUES (
    1,
    86400
) ON CONFLICT (id) DO UPDATE SET otp_exp = 86400;

-- Enable password strength and leaked password protection
-- These settings are typically managed through Supabase dashboard
-- For now we'll document the required manual steps

-- Manual steps required (to be done through Supabase Dashboard):
-- 1. Go to Authentication > Settings in your Supabase dashboard
-- 2. Under "Password Requirements", enable "Check for leaked passwords"
-- 3. Adjust OTP expiry to 24 hours or less if needed