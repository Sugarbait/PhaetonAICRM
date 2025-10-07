-- 🔧 MINIMAL DATABASE FIX
-- Only fixes the critical issues without breaking existing constraints
-- Run this in your Supabase SQL Editor

-- Step 1: Check what columns exist in users table
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users';

-- Step 2: Add missing columns safely (only if they don't exist)
DO $$
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
        ALTER TABLE users ADD COLUMN name TEXT;
    END IF;
END $$;

-- Step 3: Add data column to company_settings if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'data') THEN
        ALTER TABLE company_settings ADD COLUMN data JSONB DEFAULT '{}';
    END IF;
END $$;

-- Step 4: Create user_totp table if it doesn't exist (for MFA)
CREATE TABLE IF NOT EXISTS user_totp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    encrypted_secret TEXT NOT NULL,
    backup_codes TEXT[] DEFAULT '{}',
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Step 5: Update existing users with proper usernames (fix the constraint violation)
UPDATE users
SET username = id
WHERE username IS NULL AND id IN ('dynamic-pierre-user', 'super-user-456', 'pierre-user-789', 'guest-user-456');

-- Step 6: Insert users with proper username values (avoid constraint violations)
INSERT INTO users (id, username, email, name)
SELECT 'dynamic-pierre-user', 'dynamic-pierre-user', 'pierre@carexps.com', 'Pierre Admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'dynamic-pierre-user');

INSERT INTO users (id, username, email, name)
SELECT 'super-user-456', 'super-user-456', 'admin@carexps.com', 'Super Admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'super-user-456');

INSERT INTO users (id, username, email, name)
SELECT 'pierre-user-789', 'pierre-user-789', 'pierre.alt@carexps.com', 'Pierre Alt'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'pierre-user-789');

INSERT INTO users (id, username, email, name)
SELECT 'guest-user-456', 'guest-user-456', 'guest@carexps.com', 'Guest User'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'guest-user-456');

-- Step 7: Add default company settings
INSERT INTO company_settings (id, data)
SELECT 'logos', '{"company_logo": "", "favicon": ""}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM company_settings WHERE id = 'logos');

-- Step 8: Create the TOTP upsert function
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
SELECT 'Minimal database fixes applied successfully!' as status,
       'Username constraints fixed, MFA tables created' as details;