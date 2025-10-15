-- FIX SCRIPT FOR PIERRE'S CREDENTIALS
-- User: pierre@phaetonai.com
-- User ID: 166b5086-5ec5-49f3-9eff-68f75d0c8e79
-- Tenant: phaeton_ai
--
-- CORRECT CREDENTIALS:
-- API Key: key_cda2021a151b9a84e721299f2c04
-- Call Agent ID: agent_544379e4fc2a465b7e8eb6fd19
-- SMS Agent ID: (leave blank or fill in if needed)

-- ========================================
-- STEP 1: Clear any incorrect data from user_settings
-- ========================================
UPDATE user_settings
SET
  retell_api_key = NULL,
  call_agent_id = NULL,
  sms_agent_id = NULL,
  updated_at = NOW()
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- ========================================
-- STEP 2: Clear any incorrect data from user_profiles
-- ========================================
UPDATE user_profiles
SET
  encrypted_retell_api_key = NULL,
  encrypted_agent_config = NULL,
  updated_at = NOW()
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- ========================================
-- STEP 3: Insert correct credentials into user_settings (plain text)
-- ========================================
INSERT INTO user_settings (
  user_id,
  retell_api_key,
  call_agent_id,
  sms_agent_id,
  created_at,
  updated_at
)
VALUES (
  '166b5086-5ec5-49f3-9eff-68f75d0c8e79',
  'key_cda2021a151b9a84e721299f2c04',
  'agent_544379e4fc2a465b7e8eb6fd19',
  NULL,  -- SMS Agent ID (leave blank for now)
  NOW(),
  NOW()
)
ON CONFLICT (user_id)
DO UPDATE SET
  retell_api_key = EXCLUDED.retell_api_key,
  call_agent_id = EXCLUDED.call_agent_id,
  sms_agent_id = EXCLUDED.sms_agent_id,
  updated_at = NOW();

-- ========================================
-- STEP 4: Insert correct credentials into system_credentials (cloud storage)
-- ========================================
INSERT INTO system_credentials (
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
)
VALUES (
  'user_override',
  '166b5086-5ec5-49f3-9eff-68f75d0c8e79',
  'key_cda2021a151b9a84e721299f2c04',
  'agent_544379e4fc2a465b7e8eb6fd19',
  NULL,  -- SMS Agent ID (leave blank for now)
  'phaeton_ai',
  true,
  '{"source": "manual_fix", "created_by": "admin", "purpose": "credential_fix", "fixed_date": "2025-10-11"}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (user_id, credential_type)
DO UPDATE SET
  api_key = EXCLUDED.api_key,
  call_agent_id = EXCLUDED.call_agent_id,
  sms_agent_id = EXCLUDED.sms_agent_id,
  is_active = true,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ========================================
-- STEP 5: Verify the fix
-- ========================================
SELECT
  'VERIFICATION: user_settings' as check_name,
  user_id,
  retell_api_key,
  call_agent_id,
  sms_agent_id
FROM user_settings
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

SELECT
  'VERIFICATION: system_credentials' as check_name,
  credential_type,
  user_id,
  api_key,
  call_agent_id,
  sms_agent_id,
  tenant_id,
  is_active
FROM system_credentials
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
  AND tenant_id = 'phaeton_ai';
