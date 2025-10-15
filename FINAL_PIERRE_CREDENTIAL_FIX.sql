-- ================================================================
-- FINAL PIERRE CREDENTIAL FIX
-- ================================================================
-- Date: 2025-10-11
-- User: pierre@phaetonai.com (166b5086-5ec5-49f3-9eff-68f75d0c8e79)
-- Purpose: Definitive fix for credential loading issues
--
-- CORRECT CREDENTIALS:
-- - retell_api_key: key_cda2021a151b9a84e721299f2c04
-- - call_agent_id: agent_544379e4fc2a465b7e8eb6fd19
-- - sms_agent_id: (empty)
-- - tenant_id: phaeton_ai
-- ================================================================

-- STEP 1: VERIFY SCHEMA
-- ================================================================
SELECT '========================================' as step;
SELECT 'STEP 1: VERIFYING SCHEMA' as action;
SELECT '========================================' as step;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
AND column_name IN ('retell_api_key', 'call_agent_id', 'sms_agent_id', 'tenant_id', 'user_id')
ORDER BY column_name;

-- STEP 2: CHECK CURRENT DATA
-- ================================================================
SELECT '========================================' as step;
SELECT 'STEP 2: CHECKING CURRENT DATA' as action;
SELECT '========================================' as step;

SELECT
  user_id,
  retell_api_key,
  call_agent_id,
  sms_agent_id,
  tenant_id,
  LENGTH(retell_api_key) as api_key_length,
  LENGTH(call_agent_id) as call_agent_length,
  CASE
    WHEN retell_api_key IS NULL THEN '❌ API key is NULL'
    WHEN retell_api_key = '' THEN '❌ API key is EMPTY STRING'
    WHEN retell_api_key = 'key_cda2021a151b9a84e721299f2c04' THEN '✅ API key is CORRECT'
    ELSE '⚠️ API key is WRONG: ' || retell_api_key
  END as api_key_status,
  CASE
    WHEN call_agent_id IS NULL THEN '❌ Call Agent ID is NULL'
    WHEN call_agent_id = '' THEN '❌ Call Agent ID is EMPTY STRING'
    WHEN call_agent_id = 'agent_544379e4fc2a465b7e8eb6fd19' THEN '✅ Call Agent ID is CORRECT'
    ELSE '⚠️ Call Agent ID is WRONG: ' || call_agent_id
  END as call_agent_status
FROM user_settings
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- Check if row exists
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM user_settings WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79')
    THEN '✅ Row exists for Pierre'
    ELSE '❌ NO ROW EXISTS - Need to INSERT'
  END as row_status;

-- STEP 3: FIX THE DATA
-- ================================================================
SELECT '========================================' as step;
SELECT 'STEP 3: APPLYING FIX' as action;
SELECT '========================================' as step;

-- Delete any existing row to start fresh
DELETE FROM user_settings
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- Insert correct credentials
INSERT INTO user_settings (
  user_id,
  retell_api_key,
  call_agent_id,
  sms_agent_id,
  tenant_id
) VALUES (
  '166b5086-5ec5-49f3-9eff-68f75d0c8e79',
  'key_cda2021a151b9a84e721299f2c04',
  'agent_544379e4fc2a465b7e8eb6fd19',
  '',
  'phaeton_ai'
);

SELECT '✅ Inserted fresh credentials for Pierre' as result;

-- STEP 4: VERIFY THE FIX
-- ================================================================
SELECT '========================================' as step;
SELECT 'STEP 4: VERIFYING FIX' as action;
SELECT '========================================' as step;

SELECT
  user_id,
  retell_api_key,
  call_agent_id,
  sms_agent_id,
  tenant_id,
  CASE
    WHEN retell_api_key = 'key_cda2021a151b9a84e721299f2c04'
      AND call_agent_id = 'agent_544379e4fc2a465b7e8eb6fd19'
      AND tenant_id = 'phaeton_ai'
    THEN '✅✅✅ ALL CREDENTIALS CORRECT! ✅✅✅'
    ELSE '❌ STILL WRONG - CHECK VALUES ABOVE'
  END as final_status
FROM user_settings
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- STEP 5: CHECK RLS POLICIES
-- ================================================================
SELECT '========================================' as step;
SELECT 'STEP 5: CHECKING RLS POLICIES' as action;
SELECT '========================================' as step;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_settings'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity,
  CASE
    WHEN rowsecurity = true THEN '⚠️ RLS is ENABLED - policies may be blocking reads'
    ELSE '✅ RLS is DISABLED - no blocking'
  END as rls_status
FROM pg_tables
WHERE tablename = 'user_settings';

-- STEP 6: TEST READ ACCESS
-- ================================================================
SELECT '========================================' as step;
SELECT 'STEP 6: TESTING READ ACCESS' as action;
SELECT '========================================' as step;

-- Try to read as if we were the application
SELECT
  'Testing read access...' as test,
  COUNT(*) as rows_readable
FROM user_settings
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- FINAL SUMMARY
-- ================================================================
SELECT '========================================' as step;
SELECT 'FINAL SUMMARY' as action;
SELECT '========================================' as step;

SELECT
  '✅ SCRIPT COMPLETE!' as status,
  'Pierre''s credentials have been reset in Supabase' as action_taken,
  'Next Step: Have Pierre clear localStorage and reload the page' as next_step;

-- ================================================================
-- INSTRUCTIONS FOR USER:
-- ================================================================
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Review all output to verify:
--    - Schema has correct columns
--    - Credentials were inserted correctly
--    - RLS policies are not blocking reads
-- 3. If all checks pass, have Pierre:
--    a) Clear browser localStorage (F12 > Application > Local Storage > Clear All)
--    b) Hard refresh the page (Ctrl+Shift+R)
--    c) Login again
--    d) Go to API Configuration page
-- 4. If credentials still show wrong:
--    - Check console logs for "API Key Manager: Loading API keys"
--    - Check if localStorage is getting populated with wrong values
--    - Run this script again to reset Supabase data
-- ================================================================
