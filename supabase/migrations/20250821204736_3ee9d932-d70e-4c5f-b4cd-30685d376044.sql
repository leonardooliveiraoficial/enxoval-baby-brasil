-- Fix security issues identified by the linter

-- 1. Fix Auth OTP long expiry - Set OTP expiry to recommended 10 minutes (600 seconds)
UPDATE auth.config 
SET otp_exp = 600 
WHERE parameter = 'OTP_EXPIRY';

-- If the above doesn't work, we'll use the alternative approach
INSERT INTO auth.config (parameter, value)
VALUES ('OTP_EXPIRY', '600')
ON CONFLICT (parameter) DO UPDATE SET value = '600';

-- 2. Enable leaked password protection
UPDATE auth.config 
SET enable_leaked_password_protection = true
WHERE parameter = 'SECURITY_ENABLE_LEAKED_PASSWORD_PROTECTION';

-- If the above doesn't work, we'll use the alternative approach
INSERT INTO auth.config (parameter, value)
VALUES ('SECURITY_ENABLE_LEAKED_PASSWORD_PROTECTION', 'true')
ON CONFLICT (parameter) DO UPDATE SET value = 'true';