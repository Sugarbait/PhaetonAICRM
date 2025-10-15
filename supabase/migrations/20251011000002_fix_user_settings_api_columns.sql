-- Migration: Fix user_settings API credential columns
-- Date: 2025-10-11
-- Purpose: Add missing API credential columns to user_settings table
--
-- This migration adds missing columns required by the API key fallback service:
-- - api_key_updated_at: Timestamp for tracking credential updates
-- - retell_config: JSON column for Retell AI configuration (if not exists)
-- - encrypted_api_keys: JSON column for encrypted API keys (if not exists)
-- - retell_agent_config: JSON column for agent configuration (if not exists)
-- - encrypted_retell_keys: JSON column for encrypted Retell keys (if not exists)

-- Add api_key_updated_at column
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS api_key_updated_at TIMESTAMPTZ;

-- Add retell_config column (if not exists)
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS retell_config JSONB;

-- Add encrypted_api_keys column (if not exists)
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS encrypted_api_keys JSONB;

-- Add retell_agent_config column (if not exists)
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS retell_agent_config JSONB;

-- Add encrypted_retell_keys column (if not exists)
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS encrypted_retell_keys JSONB;

-- Add comments for documentation
COMMENT ON COLUMN user_settings.api_key_updated_at IS 'Timestamp when API credentials were last updated';
COMMENT ON COLUMN user_settings.retell_config IS 'Retell AI configuration (API key and agent IDs)';
COMMENT ON COLUMN user_settings.encrypted_api_keys IS 'Encrypted API keys for secure storage';
COMMENT ON COLUMN user_settings.retell_agent_config IS 'Retell AI agent configuration (call and SMS agent IDs)';
COMMENT ON COLUMN user_settings.encrypted_retell_keys IS 'Encrypted Retell AI keys for secure storage';

-- Create index for api_key_updated_at for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_api_key_updated_at
ON user_settings(api_key_updated_at)
WHERE api_key_updated_at IS NOT NULL;

-- Verify columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name IN ('api_key_updated_at', 'retell_config', 'encrypted_api_keys', 'retell_agent_config', 'encrypted_retell_keys')
  ) THEN
    RAISE NOTICE 'Migration successful: API credential columns added to user_settings table';
  ELSE
    RAISE EXCEPTION 'Migration failed: Required columns not found in user_settings table';
  END IF;
END $$;
