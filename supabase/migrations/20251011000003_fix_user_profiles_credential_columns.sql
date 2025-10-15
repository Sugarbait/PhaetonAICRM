-- Migration: Fix user_profiles credential columns
-- Date: 2025-10-11
-- Purpose: Add missing credential columns to user_profiles table
--
-- This migration adds missing columns required by the API key fallback service:
-- - encrypted_agent_config: JSONB column for encrypted agent configuration
-- - encrypted_retell_api_key: TEXT column for encrypted Retell AI API key

-- Add encrypted_agent_config column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS encrypted_agent_config JSONB;

-- Add encrypted_retell_api_key column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS encrypted_retell_api_key TEXT;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.encrypted_agent_config IS 'Encrypted agent configuration (call and SMS agent IDs)';
COMMENT ON COLUMN user_profiles.encrypted_retell_api_key IS 'Encrypted Retell AI API key for secure storage';

-- Create index for faster credential lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_encrypted_credentials
ON user_profiles(user_id)
WHERE encrypted_retell_api_key IS NOT NULL OR encrypted_agent_config IS NOT NULL;

-- Verify columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name IN ('encrypted_agent_config', 'encrypted_retell_api_key')
  ) THEN
    RAISE NOTICE 'Migration successful: Credential columns added to user_profiles table';
  ELSE
    RAISE EXCEPTION 'Migration failed: Required columns not found in user_profiles table';
  END IF;
END $$;
