-- ============================================================================
-- MINIMAL SCHEMA FIX FOR CAREXPS HEALTHCARE CRM
-- ============================================================================
-- This migration only adds the missing columns that are causing immediate errors
-- ============================================================================

-- ============================================================================
-- 1. FIX USER_SETTINGS TABLE BY ADDING MISSING COLUMNS
-- ============================================================================

-- Check if user_settings table exists and add missing columns
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN user_id TEXT;
        RAISE NOTICE 'Added user_id column to user_settings table';
    END IF;

    -- Add department column if it doesn't exist (for profile information)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'department'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN department TEXT;
        RAISE NOTICE 'Added department column to user_settings table';
    END IF;

    -- Add encrypted_agent_config column if it doesn't exist (for API keys)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'encrypted_agent_config'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN encrypted_agent_config JSONB;
        RAISE NOTICE 'Added encrypted_agent_config column to user_settings table';
    END IF;

    -- Add retell_config column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'retell_config'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN retell_config JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added retell_config column to user_settings table';
    END IF;

    -- Add profile name columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'profile_name'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN profile_name TEXT;
        RAISE NOTICE 'Added profile_name column to user_settings table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'profile_first_name'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN profile_first_name TEXT;
        RAISE NOTICE 'Added profile_first_name column to user_settings table';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'profile_last_name'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN profile_last_name TEXT;
        RAISE NOTICE 'Added profile_last_name column to user_settings table';
    END IF;

    RAISE NOTICE '✅ user_settings table schema updated successfully';
END $$;

-- ============================================================================
-- 2. ADD MISSING COLUMNS TO USERS TABLE IF IT EXISTS
-- ============================================================================

DO $$
BEGIN
    -- Check if users table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'users'
    ) THEN
        -- Add department column to users table if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'department'
        ) THEN
            ALTER TABLE users ADD COLUMN department TEXT;
            RAISE NOTICE 'Added department column to users table';
        END IF;

        -- Add encrypted_agent_config column to users table if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'encrypted_agent_config'
        ) THEN
            ALTER TABLE users ADD COLUMN encrypted_agent_config JSONB;
            RAISE NOTICE 'Added encrypted_agent_config column to users table';
        END IF;

        RAISE NOTICE '✅ users table schema updated successfully';
    ELSE
        RAISE NOTICE 'ℹ️ users table does not exist, skipping users table updates';
    END IF;
END $$;

-- ============================================================================
-- 3. CREATE USER_PROFILES TABLE IF IT DOESN'T EXIST (FOR API KEY STORAGE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    department TEXT,
    phone TEXT,
    bio TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    encrypted_retell_api_key TEXT,
    encrypted_agent_config JSONB, -- For API key storage
    preferences JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- ============================================================================
-- 4. ENABLE RLS AND CREATE BASIC POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for user_settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings"
ON user_settings FOR ALL
USING (
    user_id = COALESCE(auth.uid()::text, 'anonymous') OR
    user_id LIKE 'super-user-%' OR
    user_id LIKE 'guest-user-%' OR
    user_id IS NULL -- Allow NULL user_id for backward compatibility
)
WITH CHECK (
    user_id = COALESCE(auth.uid()::text, 'anonymous') OR
    user_id LIKE 'super-user-%' OR
    user_id LIKE 'guest-user-%' OR
    user_id IS NULL
);

-- Create basic RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
CREATE POLICY "Users can manage their own profile"
ON user_profiles FOR ALL
USING (
    user_id = COALESCE(auth.uid()::text, 'anonymous') OR
    user_id LIKE 'super-user-%' OR
    user_id LIKE 'guest-user-%'
)
WITH CHECK (
    user_id = COALESCE(auth.uid()::text, 'anonymous') OR
    user_id LIKE 'super-user-%' OR
    user_id LIKE 'guest-user-%'
);

-- ============================================================================
-- 5. GRANT BASIC PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- Grant permissions to service role
GRANT ALL ON user_settings TO service_role;
GRANT ALL ON user_profiles TO service_role;

-- ============================================================================
-- 6. CREATE BASIC UPDATE TRIGGER
-- ============================================================================

-- Create or update the timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for user_profiles if it doesn't exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Minimal CareXPS Schema Fix completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What was fixed:';
    RAISE NOTICE '   1. ✅ Added user_id column to user_settings table';
    RAISE NOTICE '   2. ✅ Added department column to user_settings table';
    RAISE NOTICE '   3. ✅ Added encrypted_agent_config column to user_settings table';
    RAISE NOTICE '   4. ✅ Added retell_config column to user_settings table';
    RAISE NOTICE '   5. ✅ Added profile name columns to user_settings table';
    RAISE NOTICE '   6. ✅ Created user_profiles table for extended API key storage';
    RAISE NOTICE '   7. ✅ Added basic RLS policies for security';
    RAISE NOTICE '   8. ✅ Added update triggers for timestamp management';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next Steps:';
    RAISE NOTICE '   - API Key Manager should now work properly';
    RAISE NOTICE '   - Profile Information section should save without errors';
    RAISE NOTICE '   - Cross-device API key synchronization is now supported';
    RAISE NOTICE '';
    RAISE NOTICE '💡 The application now has the required database schema to function properly!';
END $$;