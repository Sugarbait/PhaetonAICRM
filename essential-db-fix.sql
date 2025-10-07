-- 🔧 ESSENTIAL DATABASE FIX
-- Only adds missing columns, doesn't insert any user data
-- Run this in your Supabase SQL Editor

-- Step 1: Add missing 'name' column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE users ADD COLUMN name TEXT;
        RAISE NOTICE 'Added name column to users table';
    ELSE
        RAISE NOTICE 'Name column already exists in users table';
    END IF;
END $$;

-- Step 2: Add missing 'data' column to company_settings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'data') THEN
        ALTER TABLE company_settings ADD COLUMN data JSONB DEFAULT '{}';
        RAISE NOTICE 'Added data column to company_settings table';
    ELSE
        RAISE NOTICE 'Data column already exists in company_settings table';
    END IF;
END $$;

-- Step 3: Create user_totp table for MFA if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_totp') THEN
        CREATE TABLE user_totp (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL UNIQUE,
            encrypted_secret TEXT NOT NULL,
            backup_codes TEXT[] DEFAULT '{}',
            enabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_used_at TIMESTAMPTZ
        );
        RAISE NOTICE 'Created user_totp table';
    ELSE
        RAISE NOTICE 'user_totp table already exists';
    END IF;
END $$;

-- Step 4: Add default company settings data (safe operation)
INSERT INTO company_settings (id, data)
SELECT 'logos', '{"company_logo": "", "favicon": ""}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM company_settings WHERE id = 'logos');

-- Step 5: Create the TOTP upsert function
CREATE OR REPLACE FUNCTION upsert_user_totp(
    target_user_id TEXT,
    secret TEXT,
    backup_codes_json TEXT[],
    is_enabled BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO user_totp (user_id, encrypted_secret, backup_codes, enabled)
    VALUES (target_user_id, secret, backup_codes_json, is_enabled)
    ON CONFLICT (user_id)
    DO UPDATE SET
        encrypted_secret = EXCLUDED.encrypted_secret,
        backup_codes = EXCLUDED.backup_codes,
        enabled = EXCLUDED.enabled
    RETURNING id INTO result_id;

    RETURN result_id;
END;
$$;

-- Success message
SELECT
    'Essential database fixes completed!' as status,
    'Added missing columns and MFA table' as details,
    'No user data inserted to avoid constraint violations' as note;