-- VERIFICATION SCRIPT FOR PIERRE'S CREDENTIALS FIX
-- Run this AFTER applying fix-pierre-credentials.sql
-- User: pierre@phaetonai.com
-- User ID: 166b5086-5ec5-49f3-9eff-68f75d0c8e79

-- ========================================
-- TEST 1: Verify correct API key in user_settings
-- ========================================
SELECT
  'TEST 1: user_settings API key' as test_name,
  CASE
    WHEN retell_api_key = 'key_cda2021a151b9a84e721299f2c04' THEN '✅ PASS'
    WHEN retell_api_key IS NULL THEN '❌ FAIL - API key is NULL'
    WHEN retell_api_key LIKE '%$Ineed1millie$%' THEN '❌ FAIL - Password still present!'
    ELSE '⚠️ WARNING - Unexpected value: ' || substring(retell_api_key, 1, 20)
  END as result,
  retell_api_key as actual_value
FROM user_settings
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- ========================================
-- TEST 2: Verify correct Call Agent ID in user_settings
-- ========================================
SELECT
  'TEST 2: user_settings Call Agent ID' as test_name,
  CASE
    WHEN call_agent_id = 'agent_544379e4fc2a465b7e8eb6fd19' THEN '✅ PASS'
    WHEN call_agent_id IS NULL THEN '❌ FAIL - Call Agent ID is NULL'
    WHEN call_agent_id LIKE '%$Ineed1millie$%' THEN '❌ FAIL - Password still present!'
    ELSE '⚠️ WARNING - Unexpected value: ' || call_agent_id
  END as result,
  call_agent_id as actual_value
FROM user_settings
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- ========================================
-- TEST 3: Verify system_credentials exists for user
-- ========================================
SELECT
  'TEST 3: system_credentials record exists' as test_name,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    WHEN COUNT(*) = 0 THEN '❌ FAIL - No record found'
    ELSE '⚠️ WARNING - Multiple records found: ' || COUNT(*)::text
  END as result,
  COUNT(*) as record_count
FROM system_credentials
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
  AND tenant_id = 'phaeton_ai'
  AND credential_type = 'user_override'
  AND is_active = true;

-- ========================================
-- TEST 4: Verify correct API key in system_credentials
-- ========================================
SELECT
  'TEST 4: system_credentials API key' as test_name,
  CASE
    WHEN api_key = 'key_cda2021a151b9a84e721299f2c04' THEN '✅ PASS'
    WHEN api_key IS NULL THEN '❌ FAIL - API key is NULL'
    WHEN api_key LIKE '%$Ineed1millie$%' THEN '❌ FAIL - Password still present!'
    ELSE '⚠️ WARNING - Unexpected value: ' || substring(api_key, 1, 20)
  END as result,
  api_key as actual_value
FROM system_credentials
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
  AND tenant_id = 'phaeton_ai'
  AND credential_type = 'user_override'
  AND is_active = true;

-- ========================================
-- TEST 5: Verify correct Call Agent ID in system_credentials
-- ========================================
SELECT
  'TEST 5: system_credentials Call Agent ID' as test_name,
  CASE
    WHEN call_agent_id = 'agent_544379e4fc2a465b7e8eb6fd19' THEN '✅ PASS'
    WHEN call_agent_id IS NULL THEN '❌ FAIL - Call Agent ID is NULL'
    WHEN call_agent_id LIKE '%$Ineed1millie$%' THEN '❌ FAIL - Password still present!'
    ELSE '⚠️ WARNING - Unexpected value: ' || call_agent_id
  END as result,
  call_agent_id as actual_value
FROM system_credentials
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
  AND tenant_id = 'phaeton_ai'
  AND credential_type = 'user_override'
  AND is_active = true;

-- ========================================
-- TEST 6: Verify NO password in user_profiles
-- ========================================
SELECT
  'TEST 6: user_profiles (no password leak)' as test_name,
  CASE
    WHEN encrypted_retell_api_key IS NULL THEN '✅ PASS - Field is NULL (safe)'
    WHEN encrypted_retell_api_key NOT LIKE '%$Ineed1millie$%' THEN '✅ PASS - No password detected'
    ELSE '❌ FAIL - Password detected in encrypted field!'
  END as result,
  CASE
    WHEN encrypted_retell_api_key IS NULL THEN 'NULL'
    ELSE substring(encrypted_retell_api_key, 1, 30) || '...'
  END as actual_value
FROM user_profiles
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- ========================================
-- TEST 7: Global check - NO password anywhere in credential tables
-- ========================================
SELECT
  'TEST 7: Global password leak check' as test_name,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS - No password leaks detected'
    ELSE '❌ FAIL - Password found in ' || COUNT(*)::text || ' locations!'
  END as result,
  COUNT(*) as leak_count
FROM (
  SELECT 'user_settings' as source FROM user_settings
  WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
    AND (retell_api_key LIKE '%$Ineed1millie$%'
         OR call_agent_id LIKE '%$Ineed1millie$%'
         OR sms_agent_id LIKE '%$Ineed1millie$%')

  UNION ALL

  SELECT 'system_credentials' as source FROM system_credentials
  WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
    AND (api_key LIKE '%$Ineed1millie$%'
         OR call_agent_id LIKE '%$Ineed1millie$%'
         OR sms_agent_id LIKE '%$Ineed1millie$%')

  UNION ALL

  SELECT 'user_profiles' as source FROM user_profiles
  WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
    AND encrypted_retell_api_key LIKE '%$Ineed1millie$%'
) leaks;

-- ========================================
-- SUMMARY: Overall Fix Status
-- ========================================
SELECT
  'SUMMARY: Fix Verification Results' as report,
  (
    SELECT COUNT(*)
    FROM (
      -- Count passing tests
      SELECT 1 FROM user_settings
      WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
        AND retell_api_key = 'key_cda2021a151b9a84e721299f2c04'
        AND call_agent_id = 'agent_544379e4fc2a465b7e8eb6fd19'

      UNION ALL

      SELECT 1 FROM system_credentials
      WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
        AND tenant_id = 'phaeton_ai'
        AND credential_type = 'user_override'
        AND is_active = true
        AND api_key = 'key_cda2021a151b9a84e721299f2c04'
        AND call_agent_id = 'agent_544379e4fc2a465b7e8eb6fd19'
    ) checks
  ) as passing_checks,
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM (
        SELECT 1 FROM user_settings
        WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
          AND retell_api_key = 'key_cda2021a151b9a84e721299f2c04'
          AND call_agent_id = 'agent_544379e4fc2a465b7e8eb6fd19'

        UNION ALL

        SELECT 1 FROM system_credentials
        WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
          AND tenant_id = 'phaeton_ai'
          AND credential_type = 'user_override'
          AND is_active = true
          AND api_key = 'key_cda2021a151b9a84e721299f2c04'
          AND call_agent_id = 'agent_544379e4fc2a465b7e8eb6fd19'
      ) checks
    ) = 2 THEN '✅✅✅ FIX SUCCESSFUL - All checks passed!'
    ELSE '❌ FIX INCOMPLETE - Review individual test results above'
  END as overall_status;

-- ========================================
-- Display final credential state
-- ========================================
SELECT
  'FINAL STATE: Credentials for Pierre' as info,
  'user_settings' as source,
  retell_api_key,
  call_agent_id,
  sms_agent_id,
  updated_at
FROM user_settings
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'

UNION ALL

SELECT
  'FINAL STATE: Credentials for Pierre' as info,
  'system_credentials' as source,
  api_key as retell_api_key,
  call_agent_id,
  sms_agent_id,
  updated_at
FROM system_credentials
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
  AND tenant_id = 'phaeton_ai'
  AND credential_type = 'user_override'
  AND is_active = true;
