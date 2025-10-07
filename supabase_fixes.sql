-- ============================================================================
-- SUPABASE DATABASE FIXES FOR CAREXPS HEALTHCARE CRM
-- ============================================================================
-- Run these commands in Supabase SQL Editor in the exact order provided
-- This will fix all reported issues and enable cross-device synchronization
-- ============================================================================

-- 1. FIX USERS TABLE: Change UUID to TEXT for string IDs
-- ============================================================================

-- First, drop all foreign key constraints that reference users.id
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE failed_login_attempts DROP CONSTRAINT IF EXISTS failed_login_attempts_user_id_fkey;

-- Change users.id from UUID to TEXT
ALTER TABLE users ALTER COLUMN id SET DATA TYPE TEXT;

-- Update any existing UUID values to be compatible (if any exist)
-- This will convert existing UUIDs to text format
UPDATE users SET id = id::text WHERE id IS NOT NULL;

-- Change related foreign key columns to TEXT
ALTER TABLE user_profiles ALTER COLUMN user_id SET DATA TYPE TEXT;
ALTER TABLE user_settings ALTER COLUMN user_id SET DATA TYPE TEXT;
ALTER TABLE audit_logs ALTER COLUMN user_id SET DATA TYPE TEXT;
ALTER TABLE failed_login_attempts ALTER COLUMN user_id SET DATA TYPE TEXT;

-- Recreate foreign key constraints
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_settings
ADD CONSTRAINT user_settings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE failed_login_attempts
ADD CONSTRAINT failed_login_attempts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. FIX COMPANY_SETTINGS TABLE: Add missing 'data' column
-- ============================================================================

-- Add the data column as JSONB for flexible configuration storage
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

-- Add an index on the data column for better query performance
CREATE INDEX IF NOT EXISTS idx_company_settings_data ON company_settings USING GIN (data);

-- 3. FIX STORAGE RLS: Configure proper bucket policies
-- ============================================================================

-- Insert the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for avatars bucket
CREATE POLICY IF NOT EXISTS "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can view their own avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. CREATE MISSING USER_SETTINGS RECORDS
-- ============================================================================

-- Insert default user_settings for users who don't have them
INSERT INTO user_settings (
  user_id,
  theme,
  notifications_enabled,
  session_timeout,
  data_sync_enabled,
  created_at,
  updated_at
)
SELECT
  u.id,
  'light' as theme,
  true as notifications_enabled,
  900 as session_timeout, -- 15 minutes
  true as data_sync_enabled,
  NOW() as created_at,
  NOW() as updated_at
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
WHERE us.user_id IS NULL;

-- 5. ENSURE PROPER RLS POLICIES FOR ALL TABLES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY IF NOT EXISTS "Users can view their own record"
ON users FOR SELECT
USING (auth.uid()::text = id OR id LIKE 'super-user-%' OR id LIKE 'guest-user-%');

CREATE POLICY IF NOT EXISTS "Users can update their own record"
ON users FOR UPDATE
USING (auth.uid()::text = id);

CREATE POLICY IF NOT EXISTS "Allow inserts for new users"
ON users FOR INSERT
WITH CHECK (true);

-- User profiles table policies
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid()::text = user_id OR user_id LIKE 'super-user-%' OR user_id LIKE 'guest-user-%');

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
ON user_profiles FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'super-user-%' OR user_id LIKE 'guest-user-%');

-- User settings table policies
CREATE POLICY IF NOT EXISTS "Users can view their own settings"
ON user_settings FOR SELECT
USING (auth.uid()::text = user_id OR user_id LIKE 'super-user-%' OR user_id LIKE 'guest-user-%');

CREATE POLICY IF NOT EXISTS "Users can update their own settings"
ON user_settings FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own settings"
ON user_settings FOR INSERT
WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'super-user-%' OR user_id LIKE 'guest-user-%');

-- Audit logs policies (read-only for security)
CREATE POLICY IF NOT EXISTS "Users can view their own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid()::text = user_id OR user_id LIKE 'super-user-%');

CREATE POLICY IF NOT EXISTS "System can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- Company settings policies (admin access)
CREATE POLICY IF NOT EXISTS "Super users can manage company settings"
ON company_settings FOR ALL
USING (auth.uid()::text LIKE 'super-user-%');

CREATE POLICY IF NOT EXISTS "Users can view company settings"
ON company_settings FOR SELECT
USING (true);

-- Failed login attempts policies
CREATE POLICY IF NOT EXISTS "System can manage failed login attempts"
ON failed_login_attempts FOR ALL
USING (true);

-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_user_id ON failed_login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_timestamp ON failed_login_attempts(attempted_at);

-- 7. INSERT SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert super user if not exists
INSERT INTO users (id, email, full_name, created_at, updated_at)
VALUES (
  'super-user-456',
  'admin@carexps.com',
  'Super Administrator',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Insert super user profile
INSERT INTO user_profiles (
  user_id,
  display_name,
  department,
  phone,
  role,
  is_active,
  last_login,
  created_at,
  updated_at
)
VALUES (
  'super-user-456',
  'Super Admin',
  'Administration',
  '+1-555-0123',
  'super_admin',
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  updated_at = NOW(),
  last_login = NOW();

-- Insert guest user if not exists
INSERT INTO users (id, email, full_name, created_at, updated_at)
VALUES (
  'guest-user-456',
  'guest@carexps.com',
  'Guest User',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Insert guest user profile
INSERT INTO user_profiles (
  user_id,
  display_name,
  department,
  phone,
  role,
  is_active,
  last_login,
  created_at,
  updated_at
)
VALUES (
  'guest-user-456',
  'Guest',
  'Demo',
  '+1-555-0124',
  'guest',
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  updated_at = NOW(),
  last_login = NOW();

-- 8. CREATE FUNCTIONS FOR CROSS-DEVICE SYNC
-- ============================================================================

-- Function to get user sync data
CREATE OR REPLACE FUNCTION get_user_sync_data(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user', row_to_json(u.*),
    'profile', row_to_json(up.*),
    'settings', row_to_json(us.*)
  ) INTO result
  FROM users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  LEFT JOIN user_settings us ON u.id = us.user_id
  WHERE u.id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user sync timestamp
CREATE OR REPLACE FUNCTION update_sync_timestamp(p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE user_settings
  SET updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE user_profiles
  SET updated_at = NOW()
  WHERE user_id = p_user_id;

  UPDATE users
  SET updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. CREATE TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables with updated_at columns
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant permissions for service role (for server-side operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT ON company_settings TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after the above commands to verify everything is working:

-- 1. Check users table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- 2. Check company_settings has data column
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'company_settings';

-- 3. Verify user_settings records exist
-- SELECT user_id, theme FROM user_settings;

-- 4. Check storage bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'avatars';

-- 5. Test user sync function
-- SELECT get_user_sync_data('super-user-456');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ CareXPS Database fixes completed successfully!';
  RAISE NOTICE '📋 Fixed issues:';
  RAISE NOTICE '   1. Users.id changed from UUID to TEXT';
  RAISE NOTICE '   2. Added company_settings.data JSONB column';
  RAISE NOTICE '   3. Created avatars storage bucket with RLS';
  RAISE NOTICE '   4. Created missing user_settings records';
  RAISE NOTICE '   5. Configured proper RLS policies';
  RAISE NOTICE '   6. Added performance indexes';
  RAISE NOTICE '   7. Created sync functions and triggers';
  RAISE NOTICE '🚀 Cross-device synchronization is now enabled!';
END $$;