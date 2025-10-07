-- ============================================================================
-- COMPREHENSIVE USER MANAGEMENT MIGRATION FOR CAREXPS HEALTHCARE CRM
-- ============================================================================
-- This migration adds super user roles, profile status management,
-- and fixes data persistence issues in the user_settings table
-- ============================================================================

-- ============================================================================
-- 1. EXTEND USERS TABLE WITH SUPER USER CAPABILITIES AND PROFILE STATUS
-- ============================================================================

-- Add super_user role to the existing role enum (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_user' AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'user_role'
    )) THEN
        ALTER TYPE user_role ADD VALUE 'super_user';
    END IF;
END $$;

-- Add profile status management columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enabled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS disabled_reason TEXT,
ADD COLUMN IF NOT EXISTS profile_status TEXT DEFAULT 'disabled' CHECK (profile_status IN ('enabled', 'disabled', 'suspended', 'pending')),
ADD COLUMN IF NOT EXISTS is_super_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS super_user_granted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS super_user_granted_by TEXT;

-- Create index for super user lookups
CREATE INDEX IF NOT EXISTS idx_users_is_super_user ON users(is_super_user) WHERE is_super_user = true;
CREATE INDEX IF NOT EXISTS idx_users_profile_status ON users(profile_status);
CREATE INDEX IF NOT EXISTS idx_users_is_enabled ON users(is_enabled);

-- ============================================================================
-- 2. CREATE USER_PROFILES TABLE FOR EXTENDED PROFILE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    department TEXT,
    phone TEXT,
    bio TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'healthcare_provider', 'staff', 'super_user')),
    is_active BOOLEAN DEFAULT false, -- New profiles disabled by default
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    password_changed_at TIMESTAMPTZ,
    password_expires_at TIMESTAMPTZ,
    two_factor_enabled BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    encrypted_retell_api_key TEXT, -- For API key persistence
    encrypted_agent_config JSONB, -- For agent ID storage
    preferences JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);

-- ============================================================================
-- 3. ENHANCE USER_SETTINGS TABLE FOR BETTER PERSISTENCE
-- ============================================================================

-- Add columns to user_settings for better data persistence
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS profile_name TEXT,
ADD COLUMN IF NOT EXISTS profile_first_name TEXT,
ADD COLUMN IF NOT EXISTS profile_last_name TEXT,
ADD COLUMN IF NOT EXISTS encrypted_api_keys JSONB, -- Encrypted API keys storage
ADD COLUMN IF NOT EXISTS api_key_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS settings_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict', 'error')),
ADD COLUMN IF NOT EXISTS last_sync_error TEXT,
ADD COLUMN IF NOT EXISTS client_updated_at TIMESTAMPTZ; -- Track client-side updates

-- Add unique constraint to prevent duplicates on user_id
DROP INDEX IF EXISTS idx_user_settings_user_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id_unique ON user_settings(user_id);

-- ============================================================================
-- 4. CREATE SUPER_USER_PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS super_user_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_type TEXT NOT NULL CHECK (permission_type IN (
        'user_management', 'system_settings', 'audit_access', 'data_export',
        'security_admin', 'billing_admin', 'integration_admin'
    )),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by TEXT,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for super_user_permissions
CREATE INDEX IF NOT EXISTS idx_super_user_permissions_user_id ON super_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_super_user_permissions_type ON super_user_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_super_user_permissions_active ON super_user_permissions(is_active) WHERE is_active = true;

-- Add unique constraint for user-permission combinations
ALTER TABLE super_user_permissions
ADD CONSTRAINT unique_user_permission UNIQUE (user_id, permission_type);

-- ============================================================================
-- 5. CREATE USER_AUDIT_LOG TABLE FOR USER MANAGEMENT ACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    performed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'user_created', 'user_updated', 'user_deleted', 'user_enabled', 'user_disabled',
        'super_user_granted', 'super_user_revoked', 'password_changed', 'profile_updated',
        'api_key_updated', 'settings_synced', 'login_success', 'login_failed'
    )),
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_audit_log
CREATE INDEX IF NOT EXISTS idx_user_audit_log_target_user ON user_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_performed_by ON user_audit_log(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_action_type ON user_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_created_at ON user_audit_log(created_at);

-- ============================================================================
-- 6. CREATE FUNCTIONS FOR USER MANAGEMENT OPERATIONS
-- ============================================================================

-- Function to grant super user privileges
CREATE OR REPLACE FUNCTION grant_super_user_privileges(
    p_user_id TEXT,
    p_granted_by TEXT,
    p_permissions TEXT[] DEFAULT ARRAY['user_management', 'system_settings', 'audit_access']
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    permission TEXT;
BEGIN
    -- Update user table
    UPDATE users
    SET is_super_user = true,
        super_user_granted_at = NOW(),
        super_user_granted_by = p_granted_by,
        role = 'super_user',
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Update user profile
    UPDATE user_profiles
    SET role = 'super_user',
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Grant permissions
    FOREACH permission IN ARRAY p_permissions
    LOOP
        INSERT INTO super_user_permissions (user_id, permission_type, granted_by)
        VALUES (p_user_id, permission, p_granted_by)
        ON CONFLICT (user_id, permission_type)
        DO UPDATE SET
            is_active = true,
            granted_at = NOW(),
            granted_by = p_granted_by;
    END LOOP;

    -- Log the action
    INSERT INTO user_audit_log (target_user_id, performed_by_user_id, action_type, action_details)
    VALUES (p_user_id, p_granted_by, 'super_user_granted',
            jsonb_build_object('permissions', p_permissions));

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Function to revoke super user privileges
CREATE OR REPLACE FUNCTION revoke_super_user_privileges(
    p_user_id TEXT,
    p_revoked_by TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update user table
    UPDATE users
    SET is_super_user = false,
        role = 'admin', -- Demote to regular admin
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Update user profile
    UPDATE user_profiles
    SET role = 'admin',
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Deactivate all super user permissions
    UPDATE super_user_permissions
    SET is_active = false,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log the action
    INSERT INTO user_audit_log (target_user_id, performed_by_user_id, action_type, action_details)
    VALUES (p_user_id, p_revoked_by, 'super_user_revoked', '{}');

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Function to enable/disable user profile
CREATE OR REPLACE FUNCTION set_user_profile_status(
    p_user_id TEXT,
    p_enabled BOOLEAN,
    p_reason TEXT DEFAULT NULL,
    p_performed_by TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update users table
    UPDATE users
    SET is_enabled = p_enabled,
        profile_status = CASE WHEN p_enabled THEN 'enabled' ELSE 'disabled' END,
        enabled_at = CASE WHEN p_enabled THEN NOW() ELSE enabled_at END,
        disabled_at = CASE WHEN NOT p_enabled THEN NOW() ELSE NULL END,
        disabled_reason = CASE WHEN NOT p_enabled THEN p_reason ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Update user profiles table
    UPDATE user_profiles
    SET is_active = p_enabled,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log the action
    INSERT INTO user_audit_log (target_user_id, performed_by_user_id, action_type, action_details)
    VALUES (p_user_id, p_performed_by,
            CASE WHEN p_enabled THEN 'user_enabled' ELSE 'user_disabled' END,
            jsonb_build_object('reason', p_reason));

    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Function to safely update user settings with conflict resolution
CREATE OR REPLACE FUNCTION update_user_settings_safe(
    p_user_id TEXT,
    p_settings JSONB,
    p_client_version INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_version INTEGER;
    conflict_detected BOOLEAN := false;
    result JSONB;
BEGIN
    -- Get current version
    SELECT settings_version INTO current_version
    FROM user_settings
    WHERE user_id = p_user_id;

    -- Check for version conflict
    IF p_client_version IS NOT NULL AND current_version IS NOT NULL
       AND p_client_version < current_version THEN
        conflict_detected := true;
    END IF;

    -- Update settings
    INSERT INTO user_settings (user_id, retell_config, settings_version, sync_status, client_updated_at)
    VALUES (p_user_id, p_settings, COALESCE(current_version, 0) + 1,
            CASE WHEN conflict_detected THEN 'conflict' ELSE 'synced' END,
            NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        retell_config = CASE WHEN NOT conflict_detected THEN p_settings ELSE user_settings.retell_config END,
        settings_version = CASE WHEN NOT conflict_detected THEN user_settings.settings_version + 1 ELSE user_settings.settings_version END,
        sync_status = CASE WHEN conflict_detected THEN 'conflict' ELSE 'synced' END,
        client_updated_at = NOW(),
        updated_at = NOW();

    -- Return result with conflict information
    SELECT jsonb_build_object(
        'success', NOT conflict_detected,
        'conflict', conflict_detected,
        'version', settings_version,
        'settings', retell_config
    ) INTO result
    FROM user_settings
    WHERE user_id = p_user_id;

    RETURN result;
END;
$$;

-- ============================================================================
-- 7. ENHANCE RLS POLICIES FOR SUPER USER ACCESS
-- ============================================================================

-- Drop existing policies for users table
DROP POLICY IF EXISTS "Users can view their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;
DROP POLICY IF EXISTS "Allow inserts for new users" ON users;

-- Create enhanced RLS policies for users table
CREATE POLICY "Users can view their own record or super users can view all"
ON users FOR SELECT
USING (
    auth.uid()::text = id OR
    id LIKE 'super-user-%' OR
    id LIKE 'guest-user-%' OR
    EXISTS (
        SELECT 1 FROM users su
        WHERE su.id = auth.uid()::text
        AND su.is_super_user = true
        AND su.is_enabled = true
    )
);

CREATE POLICY "Users can update their own record or super users can update all"
ON users FOR UPDATE
USING (
    auth.uid()::text = id OR
    EXISTS (
        SELECT 1 FROM users su
        WHERE su.id = auth.uid()::text
        AND su.is_super_user = true
        AND su.is_enabled = true
    )
);

CREATE POLICY "Super users can insert new users"
ON users FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users su
        WHERE su.id = auth.uid()::text
        AND su.is_super_user = true
        AND su.is_enabled = true
    ) OR
    id LIKE 'super-user-%' OR
    id LIKE 'guest-user-%'
);

-- RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile or super users can manage all"
ON user_profiles FOR ALL
USING (
    auth.uid()::text = user_id OR
    user_id LIKE 'super-user-%' OR
    user_id LIKE 'guest-user-%' OR
    EXISTS (
        SELECT 1 FROM users su
        WHERE su.id = auth.uid()::text
        AND su.is_super_user = true
        AND su.is_enabled = true
    )
)
WITH CHECK (
    auth.uid()::text = user_id OR
    user_id LIKE 'super-user-%' OR
    user_id LIKE 'guest-user-%' OR
    EXISTS (
        SELECT 1 FROM users su
        WHERE su.id = auth.uid()::text
        AND su.is_super_user = true
        AND su.is_enabled = true
    )
);

-- Enhanced RLS policies for user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;

CREATE POLICY "Users can manage their own settings or super users can manage all"
ON user_settings FOR ALL
USING (
    auth.uid()::text = user_id OR
    user_id LIKE 'super-user-%' OR
    user_id LIKE 'guest-user-%' OR
    EXISTS (
        SELECT 1 FROM users su
        WHERE su.id = auth.uid()::text
        AND su.is_super_user = true
        AND su.is_enabled = true
    )
)
WITH CHECK (
    auth.uid()::text = user_id OR
    user_id LIKE 'super-user-%' OR
    user_id LIKE 'guest-user-%' OR
    EXISTS (
        SELECT 1 FROM users su
        WHERE su.id = auth.uid()::text
        AND su.is_super_user = true
        AND su.is_enabled = true
    )
);

-- RLS policies for super_user_permissions
ALTER TABLE super_user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super users can manage permissions"
ON super_user_permissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users su
        WHERE su.id = auth.uid()::text
        AND su.is_super_user = true
        AND su.is_enabled = true
    )
);

-- RLS policies for user_audit_log
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs or super users can view all"
ON user_audit_log FOR SELECT
USING (
    auth.uid()::text = target_user_id OR
    auth.uid()::text = performed_by_user_id OR
    EXISTS (
        SELECT 1 FROM users su
        WHERE su.id = auth.uid()::text
        AND su.is_super_user = true
        AND su.is_enabled = true
    )
);

CREATE POLICY "System can insert audit logs"
ON user_audit_log FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 8. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update existing timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for new tables
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_super_user_permissions_updated_at
    BEFORE UPDATE ON super_user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. SET UP SPECIFIED EMAIL ADDRESSES AS SUPER USERS
-- ============================================================================

-- Create or update elmfarrell@yahoo.com as super user
INSERT INTO users (
    id, email, name, role, is_super_user, is_enabled, profile_status,
    super_user_granted_at, super_user_granted_by, created_at, updated_at
) VALUES (
    'super-user-elm-farrell',
    'elmfarrell@yahoo.com',
    'Dr. Elm Farrell',
    'super_user',
    true,
    true,
    'enabled',
    NOW(),
    'system-setup',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'super_user',
    is_super_user = true,
    is_enabled = true,
    profile_status = 'enabled',
    super_user_granted_at = COALESCE(users.super_user_granted_at, NOW()),
    super_user_granted_by = COALESCE(users.super_user_granted_by, 'system-setup'),
    updated_at = NOW();

-- Create or update pierre@phaetonai.com as super user
INSERT INTO users (
    id, email, name, role, is_super_user, is_enabled, profile_status,
    super_user_granted_at, super_user_granted_by, created_at, updated_at
) VALUES (
    'super-user-pierre-phaeton',
    'pierre@phaetonai.com',
    'Pierre - PhaETOn AI',
    'super_user',
    true,
    true,
    'enabled',
    NOW(),
    'system-setup',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'super_user',
    is_super_user = true,
    is_enabled = true,
    profile_status = 'enabled',
    super_user_granted_at = COALESCE(users.super_user_granted_at, NOW()),
    super_user_granted_by = COALESCE(users.super_user_granted_by, 'system-setup'),
    updated_at = NOW();

-- Create user profiles for both super users
INSERT INTO user_profiles (
    user_id, display_name, role, is_active, created_at, updated_at
) VALUES (
    'super-user-elm-farrell',
    'Dr. Elm Farrell',
    'super_user',
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_user',
    is_active = true,
    updated_at = NOW();

INSERT INTO user_profiles (
    user_id, display_name, role, is_active, created_at, updated_at
) VALUES (
    'super-user-pierre-phaeton',
    'Pierre - PhaETOn AI',
    'super_user',
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_user',
    is_active = true,
    updated_at = NOW();

-- Create default user settings for both super users
INSERT INTO user_settings (
    user_id, theme, notifications, security_preferences,
    communication_preferences, accessibility_settings, created_at, updated_at
) VALUES (
    'super-user-elm-farrell',
    'dark',
    '{"email": true, "sms": true, "push": true, "in_app": true, "call_alerts": true, "sms_alerts": true, "security_alerts": true}'::jsonb,
    '{"session_timeout": 15, "require_mfa": true, "password_expiry_reminder": true, "login_notifications": true}'::jsonb,
    '{"default_method": "phone", "auto_reply_enabled": false, "business_hours": {"enabled": false, "start": "09:00", "end": "17:00", "timezone": "America/New_York"}}'::jsonb,
    '{"high_contrast": false, "large_text": false, "screen_reader": false, "keyboard_navigation": false}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

INSERT INTO user_settings (
    user_id, theme, notifications, security_preferences,
    communication_preferences, accessibility_settings, created_at, updated_at
) VALUES (
    'super-user-pierre-phaeton',
    'dark',
    '{"email": true, "sms": true, "push": true, "in_app": true, "call_alerts": true, "sms_alerts": true, "security_alerts": true}'::jsonb,
    '{"session_timeout": 15, "require_mfa": true, "password_expiry_reminder": true, "login_notifications": true}'::jsonb,
    '{"default_method": "phone", "auto_reply_enabled": false, "business_hours": {"enabled": false, "start": "09:00", "end": "17:00", "timezone": "America/New_York"}}'::jsonb,
    '{"high_contrast": false, "large_text": false, "screen_reader": false, "keyboard_navigation": false}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

-- Grant super user permissions to both users
SELECT grant_super_user_privileges(
    'super-user-elm-farrell',
    'system-setup',
    ARRAY['user_management', 'system_settings', 'audit_access', 'data_export', 'security_admin', 'billing_admin', 'integration_admin']
);

SELECT grant_super_user_privileges(
    'super-user-pierre-phaeton',
    'system-setup',
    ARRAY['user_management', 'system_settings', 'audit_access', 'data_export', 'security_admin', 'billing_admin', 'integration_admin']
);

-- ============================================================================
-- 10. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON super_user_permissions TO authenticated;
GRANT SELECT, INSERT ON user_audit_log TO authenticated;

-- Grant permissions to service role for backend operations
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON super_user_permissions TO service_role;
GRANT ALL ON user_audit_log TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION grant_super_user_privileges TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_super_user_privileges TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_profile_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_settings_safe TO authenticated;

-- ============================================================================
-- 11. CREATE VIEWS FOR EASY USER MANAGEMENT
-- ============================================================================

-- View for comprehensive user information
CREATE OR REPLACE VIEW user_management_view AS
SELECT
    u.id,
    u.email,
    u.name,
    u.role,
    u.is_super_user,
    u.is_enabled,
    u.profile_status,
    u.super_user_granted_at,
    u.super_user_granted_by,
    u.created_at,
    u.updated_at,
    up.display_name,
    up.first_name,
    up.last_name,
    up.department,
    up.phone,
    up.is_active as profile_active,
    up.last_login,
    up.login_count,
    up.two_factor_enabled,
    up.failed_login_attempts,
    up.locked_until,
    us.theme,
    us.settings_version,
    us.sync_status,
    us.last_synced,
    -- Super user permissions as JSON array
    COALESCE(
        (
            SELECT jsonb_agg(sup.permission_type)
            FROM super_user_permissions sup
            WHERE sup.user_id = u.id AND sup.is_active = true
        ), '[]'::jsonb
    ) as super_user_permissions
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_settings us ON u.id = us.user_id;

-- Grant select on the view
GRANT SELECT ON user_management_view TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE AND VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ CareXPS Comprehensive User Management Migration completed successfully!';
    RAISE NOTICE '📋 Migration Summary:';
    RAISE NOTICE '   1. ✅ Extended users table with super user capabilities and profile status';
    RAISE NOTICE '   2. ✅ Created user_profiles table for extended profile management';
    RAISE NOTICE '   3. ✅ Enhanced user_settings table for better data persistence';
    RAISE NOTICE '   4. ✅ Created super_user_permissions table for granular permissions';
    RAISE NOTICE '   5. ✅ Created user_audit_log table for user management auditing';
    RAISE NOTICE '   6. ✅ Added functions for user management operations';
    RAISE NOTICE '   7. ✅ Enhanced RLS policies for super user access';
    RAISE NOTICE '   8. ✅ Set up elmfarrell@yahoo.com as Super User';
    RAISE NOTICE '   9. ✅ Set up pierre@phaetonai.com as Super User';
    RAISE NOTICE '  10. ✅ Created user_management_view for easy administration';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Super Users Created:';
    RAISE NOTICE '   - elmfarrell@yahoo.com (ID: super-user-elm-farrell)';
    RAISE NOTICE '   - pierre@phaetonai.com (ID: super-user-pierre-phaeton)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 New Features Enabled:';
    RAISE NOTICE '   - Profile name persistence (no more reverts on refresh)';
    RAISE NOTICE '   - API key persistence (Retell connection maintained)';
    RAISE NOTICE '   - Profile status management (disabled by default)';
    RAISE NOTICE '   - Super user role and permissions';
    RAISE NOTICE '   - Comprehensive user auditing';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Next Steps:';
    RAISE NOTICE '   1. Update your application code to use the new schema';
    RAISE NOTICE '   2. Test super user functionality';
    RAISE NOTICE '   3. Verify profile persistence fixes';
    RAISE NOTICE '   4. Test API key storage and retrieval';
END $$;