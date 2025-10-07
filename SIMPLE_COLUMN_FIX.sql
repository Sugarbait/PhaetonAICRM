-- ============================================================================
-- SIMPLE COLUMN FIX FOR CAREXPS HEALTHCARE CRM
-- ============================================================================
-- This migration simply adds the missing columns one by one
-- ============================================================================

-- Add user_id column to user_settings if it doesn't exist
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add department column to user_settings if it doesn't exist
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS department TEXT;

-- Add encrypted_agent_config column to user_settings if it doesn't exist
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS encrypted_agent_config JSONB;

-- Add retell_config column to user_settings if it doesn't exist
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS retell_config JSONB DEFAULT '{}'::jsonb;

-- Add profile name columns to user_settings if they don't exist
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS profile_name TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS profile_first_name TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS profile_last_name TEXT;

-- Add other potentially missing columns
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS api_key_updated_at TIMESTAMPTZ;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS settings_version INTEGER DEFAULT 1;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS last_sync_error TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS client_updated_at TIMESTAMPTZ;

-- Try to add columns to users table if it exists
DO $$
BEGIN
    -- Only try to modify users table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Add department column to users table if it doesn't exist
        EXECUTE 'ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT';
        -- Add encrypted_agent_config column to users table if it doesn't exist
        EXECUTE 'ALTER TABLE users ADD COLUMN IF NOT EXISTS encrypted_agent_config JSONB';
        RAISE NOTICE 'Added columns to users table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not modify users table: %', SQLERRM;
END $$;

-- Create a simple notification
SELECT 'Schema fix completed - missing columns added' AS result;