-- Migration: Add API credential columns to user_settings table
-- Date: 2025-10-06
-- Purpose: Add individual API credential columns for Retell AI integration
--
-- This migration adds three columns to store user-specific API credentials:
-- 1. retell_api_key - Retell AI API key
-- 2. call_agent_id - Retell AI Call Agent ID
-- 3. sms_agent_id - Retell AI SMS Agent ID
--
-- These columns are used by ARTLEE CRM to persist user API configurations
-- across sessions and devices, matching the schema used by MedEx and CareXPS.

-- Add API credential columns to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS retell_api_key TEXT,
ADD COLUMN IF NOT EXISTS call_agent_id TEXT,
ADD COLUMN IF NOT EXISTS sms_agent_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN user_settings.retell_api_key IS 'Retell AI API key for user-specific integration';
COMMENT ON COLUMN user_settings.call_agent_id IS 'Retell AI Call Agent ID for voice call management';
COMMENT ON COLUMN user_settings.sms_agent_id IS 'Retell AI SMS Agent ID for SMS/chat management';

-- Create index for faster lookups by user_id (if not already exists)
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Verify columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name IN ('retell_api_key', 'call_agent_id', 'sms_agent_id')
  ) THEN
    RAISE NOTICE 'Migration successful: API credential columns added to user_settings table';
  ELSE
    RAISE EXCEPTION 'Migration failed: API credential columns not found in user_settings table';
  END IF;
END $$;
