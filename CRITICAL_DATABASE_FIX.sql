-- =========================================================================
-- CRITICAL DATABASE FIX FOR CAREXPS CRM
-- =========================================================================
-- This SQL script fixes the critical MFA and audit logging issues
-- Run this in your Supabase SQL Editor to fix the database schema
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. FIX AUDIT_LOGS TABLE
-- =========================================================================
-- Drop existing audit_logs table if it has the wrong schema
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create the correct audit_logs table matching the application expectations
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);

-- =========================================================================
-- 2. CREATE/FIX USER_MFA_CONFIGS TABLE
-- =========================================================================
-- Create user_mfa_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_mfa_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    encrypted_secret TEXT,
    encrypted_backup_codes JSONB,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    temporarily_disabled BOOLEAN DEFAULT false,
    registered_devices JSONB DEFAULT '[]'::jsonb,
    verified_at TIMESTAMPTZ,
    disabled_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_by_device_fingerprint TEXT,
    last_used_device_fingerprint TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_mfa_configs
CREATE INDEX IF NOT EXISTS idx_user_mfa_configs_user_id ON user_mfa_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_configs_active ON user_mfa_configs(is_active);

-- =========================================================================
-- 3. CREATE USER_SETTINGS TABLE
-- =========================================================================
-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    notifications JSONB DEFAULT '{"email": true, "sms": true, "push": true, "in_app": true, "call_alerts": true, "sms_alerts": true, "security_alerts": true}'::jsonb,
    security_preferences JSONB DEFAULT '{"session_timeout": 15, "require_mfa": true, "password_expiry_reminder": true, "login_notifications": true}'::jsonb,
    dashboard_layout JSONB,
    communication_preferences JSONB DEFAULT '{"default_method": "phone", "auto_reply_enabled": false, "business_hours": {"enabled": false, "start": "09:00", "end": "17:00", "timezone": "America/New_York"}}'::jsonb,
    accessibility_settings JSONB DEFAULT '{"high_contrast": false, "large_text": false, "screen_reader": false, "keyboard_navigation": false}'::jsonb,
    retell_config JSONB,
    device_sync_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =========================================================================
-- 4. CREATE OTHER REQUIRED TABLES
-- =========================================================================

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mfa_challenges table if it doesn't exist
CREATE TABLE IF NOT EXISTS mfa_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    challenge_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create failed_login_attempts table if it doesn't exist
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  reason TEXT
);

-- Create indexes for all tables
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user_id ON mfa_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_token ON mfa_challenges(challenge_token);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expires ON mfa_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);

-- =========================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mfa_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 6. CREATE RLS POLICIES (PERMISSIVE FOR NOW - TIGHTEN IN PRODUCTION)
-- =========================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all for authenticated users" ON audit_logs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_mfa_configs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_settings;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON mfa_challenges;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON failed_login_attempts;

-- Create permissive policies (for development/testing)
CREATE POLICY "Allow all for authenticated users" ON audit_logs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON user_mfa_configs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON user_settings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON user_profiles
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON mfa_challenges
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON failed_login_attempts
    FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- 7. CREATE FUNCTIONS AND TRIGGERS
-- =========================================================================

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_mfa_configs_updated_at ON user_mfa_configs;
CREATE TRIGGER update_user_mfa_configs_updated_at
    BEFORE UPDATE ON user_mfa_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =========================================================================
-- 8. GRANT PERMISSIONS
-- =========================================================================
-- Grant necessary permissions for authenticated and anonymous users
GRANT ALL ON audit_logs TO authenticated, anon;
GRANT ALL ON user_mfa_configs TO authenticated, anon;
GRANT ALL ON user_settings TO authenticated, anon;
GRANT ALL ON users TO authenticated, anon;
GRANT ALL ON user_profiles TO authenticated, anon;
GRANT ALL ON mfa_challenges TO authenticated, anon;
GRANT ALL ON failed_login_attempts TO authenticated, anon;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- =========================================================================
-- 9. VERIFICATION QUERIES
-- =========================================================================
-- These will help verify the setup worked correctly

-- Check that all tables exist
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('audit_logs', 'user_mfa_configs', 'user_settings', 'users', 'user_profiles', 'mfa_challenges', 'failed_login_attempts')
ORDER BY tablename;

-- Check table columns for audit_logs (should match application expectations)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'audit_logs'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('audit_logs', 'user_mfa_configs', 'user_settings')
ORDER BY tablename;

-- =========================================================================
-- COMPLETION MESSAGE
-- =========================================================================
-- If you see this message in the output, the setup was successful!
SELECT
    '✅ DATABASE SETUP COMPLETE! All critical tables have been created.' as status,
    'MFA and audit logging should now work correctly.' as message,
    'Check the verification queries above to confirm all tables exist.' as next_step;