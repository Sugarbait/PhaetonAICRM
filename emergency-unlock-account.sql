-- ================================================
-- EMERGENCY: Unlock Account
-- ================================================
-- This will clear all failed login attempts and allow login

-- Clear all failed login attempts for pierre@phaetonai.com
DELETE FROM failed_login_attempts WHERE email = 'pierre@phaetonai.com';

-- Also clear for test@test.com if needed
DELETE FROM failed_login_attempts WHERE email = 'test@test.com';

-- Optionally: Re-enable RLS (but this shouldn't block login)
-- ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'Account unlocked - all failed attempts cleared' AS status;
