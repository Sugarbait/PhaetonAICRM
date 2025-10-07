-- 🔧 SUPABASE SCHEMA FIX V2
-- Compatible with all PostgreSQL versions
-- Run this in your Supabase SQL Editor

-- Fix 1: Add missing 'name' column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS name TEXT;

-- Fix 2: Add missing 'data' column to company_settings table
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

-- Fix 3: Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    role TEXT DEFAULT 'user',
    encrypted_retell_api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix 4: Create user_totp table for MFA if it doesn't exist
CREATE TABLE IF NOT EXISTS user_totp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    encrypted_secret TEXT NOT NULL,
    backup_codes TEXT[] DEFAULT '{}',
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Fix 5: Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_totp ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Fix 6: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own TOTP" ON user_totp;
DROP POLICY IF EXISTS "Users can update own TOTP" ON user_totp;
DROP POLICY IF EXISTS "Users can insert own TOTP" ON user_totp;

DROP POLICY IF EXISTS "Anyone can view company settings" ON company_settings;
DROP POLICY IF EXISTS "Service role can manage company settings" ON company_settings;

-- Fix 7: Create RLS policies for users table
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (true);

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (true);

-- Fix 8: Create RLS policies for user_profiles table
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- Fix 9: Create RLS policies for user_totp table
CREATE POLICY "Users can view own TOTP" ON user_totp
    FOR SELECT USING (true);

CREATE POLICY "Users can update own TOTP" ON user_totp
    FOR UPDATE USING (true);

CREATE POLICY "Users can insert own TOTP" ON user_totp
    FOR INSERT WITH CHECK (true);

-- Fix 10: Create RLS policies for company_settings table
CREATE POLICY "Anyone can view company settings" ON company_settings
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage company settings" ON company_settings
    FOR ALL USING (true);

-- Fix 11: Create function to upsert user TOTP data
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
        enabled = EXCLUDED.enabled,
        created_at = CASE
            WHEN user_totp.enabled = FALSE AND EXCLUDED.enabled = TRUE
            THEN NOW()
            ELSE user_totp.created_at
        END
    RETURNING id INTO result_id;

    RETURN result_id;
END;
$$;

-- Fix 12: Insert demo data for testing (only if doesn't exist)
INSERT INTO users (id, email, name)
SELECT 'dynamic-pierre-user', 'pierre@carexps.com', 'Pierre Admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'dynamic-pierre-user');

INSERT INTO users (id, email, name)
SELECT 'super-user-456', 'admin@carexps.com', 'Super Admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'super-user-456');

INSERT INTO users (id, email, name)
SELECT 'pierre-user-789', 'pierre.alt@carexps.com', 'Pierre Alt'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'pierre-user-789');

INSERT INTO users (id, email, name)
SELECT 'guest-user-456', 'guest@carexps.com', 'Guest User'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'guest-user-456');

-- Fix 13: Insert default company settings (only if doesn't exist)
INSERT INTO company_settings (id, data)
SELECT 'logos', '{"company_logo": "", "favicon": ""}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM company_settings WHERE id = 'logos');

INSERT INTO company_settings (id, data)
SELECT 'app_config', '{"app_name": "CareXPS Healthcare CRM", "version": "1.0.0"}'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM company_settings WHERE id = 'app_config');

-- Fix 14: Create storage bucket for avatars (safe to run multiple times)
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars');

-- Fix 15: Create storage policies for avatars
DROP POLICY IF EXISTS "Avatar uploads are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;

CREATE POLICY "Avatar uploads are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Success message
SELECT 'Database schema fixes applied successfully! V2' as status;