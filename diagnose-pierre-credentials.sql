-- URGENT CREDENTIAL DIAGNOSIS FOR PIERRE
-- User: pierre@phaetonai.com
-- User ID: 166b5086-5ec5-49f3-9eff-68f75d0c8e79
-- Tenant: phaeton_ai
-- Issue: Login password appearing instead of API keys

-- ========================================
-- STEP 1: Check user_settings table
-- ========================================
SELECT
  'user_settings' as table_name,
  user_id,
  retell_api_key,
  call_agent_id,
  sms_agent_id,
  length(retell_api_key) as api_key_length,
  created_at,
  updated_at
FROM user_settings
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- ========================================
-- STEP 2: Check user_profiles table for encrypted credentials
-- ========================================
SELECT
  'user_profiles' as table_name,
  user_id,
  encrypted_retell_api_key,
  encrypted_agent_config,
  length(encrypted_retell_api_key) as encrypted_key_length,
  created_at,
  updated_at
FROM user_profiles
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- ========================================
-- STEP 3: Check system_credentials table for user overrides
-- ========================================
SELECT
  'system_credentials' as table_name,
  id,
  credential_type,
  user_id,
  api_key,
  call_agent_id,
  sms_agent_id,
  tenant_id,
  is_active,
  metadata,
  created_at,
  updated_at
FROM system_credentials
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
  AND tenant_id = 'phaeton_ai';

-- ========================================
-- STEP 4: Check system defaults for tenant
-- ========================================
SELECT
  'system_credentials (defaults)' as table_name,
  id,
  credential_type,
  api_key,
  call_agent_id,
  sms_agent_id,
  tenant_id,
  is_active,
  metadata,
  created_at,
  updated_at
FROM system_credentials
WHERE credential_type = 'system_defaults'
  AND tenant_id = 'phaeton_ai'
  AND is_active = true;

-- ========================================
-- STEP 5: Check users table for basic info
-- ========================================
SELECT
  'users' as table_name,
  id,
  email,
  name,
  tenant_id,
  role,
  is_active,
  created_at
FROM users
WHERE id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- ========================================
-- STEP 6: Search for the problematic password value
-- ========================================
-- Check if password is stored in wrong place
SELECT
  'SECURITY CHECK: Looking for password in credential fields' as warning,
  COUNT(*) as found_count
FROM user_settings
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
  AND (
    retell_api_key LIKE '%$Ineed1millie$%'
    OR call_agent_id LIKE '%$Ineed1millie$%'
    OR sms_agent_id LIKE '%$Ineed1millie$%'
  );

-- ========================================
-- STEP 7: Check ALL credentials for this tenant
-- ========================================
SELECT
  'All credentials for phaeton_ai tenant' as info,
  credential_type,
  user_id,
  substring(api_key, 1, 20) as api_key_preview,
  call_agent_id,
  sms_agent_id,
  is_active,
  created_at
FROM system_credentials
WHERE tenant_id = 'phaeton_ai'
ORDER BY created_at DESC;
