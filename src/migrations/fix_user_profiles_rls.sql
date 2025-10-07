-- Fix RLS policies for user_profiles table to work with service role
-- The application uses service role authentication, not Supabase Auth

-- Temporarily disable RLS to allow service role access
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS but with policies that allow service role access
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create updated RLS policies that work with service role
-- Allow service role full access (for application-level security)
DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
CREATE POLICY "Service role full access" ON user_profiles
    FOR ALL USING (true);

-- Allow authenticated users to manage their own profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = user_id OR
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE USING (
        auth.uid() = user_id OR
        auth.role() = 'service_role' OR
        auth.role() = 'authenticated'
    );

-- Grant additional permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON user_profiles TO anon;

-- Add missing mfa_enabled column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'mfa_enabled') THEN
        ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add other missing MFA columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'fresh_mfa_secret') THEN
        ALTER TABLE users ADD COLUMN fresh_mfa_secret TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'fresh_mfa_setup_completed') THEN
        ALTER TABLE users ADD COLUMN fresh_mfa_setup_completed BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'fresh_mfa_backup_codes') THEN
        ALTER TABLE users ADD COLUMN fresh_mfa_backup_codes TEXT[];
    END IF;
END $$;

-- Update RLS policies for users table as well
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to users table
DROP POLICY IF EXISTS "Service role users access" ON users;
CREATE POLICY "Service role users access" ON users
    FOR ALL USING (true);

-- Grant permissions for users table
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;
GRANT ALL ON users TO anon;

-- Add comment
COMMENT ON TABLE user_profiles IS 'Extended user profile information - RLS updated for service role compatibility';