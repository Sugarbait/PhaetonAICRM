-- Simple Fix: Insert Pierre's Correct Credentials
-- Date: 2025-10-11
-- User: pierre@phaetonai.com (166b5086-5ec5-49f3-9eff-68f75d0c8e79)

-- Step 1: Clear any existing wrong credentials
UPDATE user_settings
SET
  retell_api_key = NULL,
  call_agent_id = NULL,
  sms_agent_id = NULL
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- Step 2: Insert correct credentials
UPDATE user_settings
SET
  retell_api_key = 'key_cda2021a151b9a84e721299f2c04',
  call_agent_id = 'agent_544379e4fc2a465b7e8eb6fd19',
  sms_agent_id = '',
  tenant_id = 'phaeton_ai'
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- If no row exists, insert one
INSERT INTO user_settings (user_id, retell_api_key, call_agent_id, sms_agent_id, tenant_id)
SELECT
  '166b5086-5ec5-49f3-9eff-68f75d0c8e79',
  'key_cda2021a151b9a84e721299f2c04',
  'agent_544379e4fc2a465b7e8eb6fd19',
  '',
  'phaeton_ai'
WHERE NOT EXISTS (
  SELECT 1 FROM user_settings WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
);

-- Step 3: Verify the fix
SELECT
  user_id,
  retell_api_key,
  call_agent_id,
  sms_agent_id,
  tenant_id,
  CASE
    WHEN retell_api_key = 'key_cda2021a151b9a84e721299f2c04'
      AND call_agent_id = 'agent_544379e4fc2a465b7e8eb6fd19'
    THEN '✅ CREDENTIALS CORRECT!'
    ELSE '❌ CREDENTIALS WRONG!'
  END as status
FROM user_settings
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79';

-- Success message
SELECT '✅ Fix complete! Pierre''s credentials have been updated.' as result;
