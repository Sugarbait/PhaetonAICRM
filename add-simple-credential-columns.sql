-- Simple Migration: Add Plain Text Credential Columns
-- Date: 2025-10-11
-- Purpose: Add the exact columns needed by the application code

-- Add plain text credential columns to user_settings
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS retell_api_key TEXT;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS call_agent_id TEXT;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS sms_agent_id TEXT;

-- Add tenant_id if it doesn't exist
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'phaeton_ai';

-- Verify columns were added
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'user_settings'
      AND column_name = 'retell_api_key'
    ) THEN '✅ retell_api_key column exists'
    ELSE '❌ retell_api_key column missing'
  END as retell_api_key_status,

  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'user_settings'
      AND column_name = 'call_agent_id'
    ) THEN '✅ call_agent_id column exists'
    ELSE '❌ call_agent_id column missing'
  END as call_agent_id_status,

  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'user_settings'
      AND column_name = 'sms_agent_id'
    ) THEN '✅ sms_agent_id column exists'
    ELSE '❌ sms_agent_id column missing'
  END as sms_agent_id_status;

-- Success message
SELECT '✅ Migration complete! Columns added to user_settings table.' as result;
