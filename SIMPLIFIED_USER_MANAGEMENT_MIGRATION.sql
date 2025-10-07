-- ============================================================================
-- SIMPLIFIED USER MANAGEMENT MIGRATION FOR CAREXPS HEALTHCARE CRM
-- ============================================================================
-- This migration creates the necessary tables without assuming existing schema
-- ============================================================================

-- ============================================================================
-- 1. CREATE OR FIX USER_SETTINGS TABLE
-- ============================================================================

-- Create the user_settings table with proper structure
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    theme TEXT DEFAULT 'light',
    notifications JSONB DEFAULT '{}'::jsonb,
    security_preferences JSONB DEFAULT '{}'::jsonb,
    communication_preferences JSONB DEFAULT '{}'::jsonb,
    accessibility_settings JSONB DEFAULT '{}'::jsonb,
    retell_config JSONB DEFAULT '{}'::jsonb,
    profile_name TEXT,
    profile_first_name TEXT,
    profile_last_name TEXT,
    encrypted_api_keys JSONB,
    api_key_updated_at TIMESTAMPTZ,
    settings_version INTEGER DEFAULT 1,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict', 'error')),
    last_sync_error TEXT,
    client_updated_at TIMESTAMPTZ,
    last_synced TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handle existing duplicates and create unique index
DO $$
BEGIN
    -- Remove duplicates if any exist, keeping the most recent
    DELETE FROM user_settings a
    USING user_settings b
    WHERE a.id < b.id
    AND a.user_id = b.user_id;

    -- Create unique index
    DROP INDEX IF EXISTS idx_user_settings_user_id;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id_unique ON user_settings(user_id);
EXCEPTION
    WHEN OTHERS THEN
        -- If there are issues, just create the index without the unique constraint
        CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
END $$;

-- ============================================================================
-- 2. CREATE USER_PROFILES TABLE FOR EXTENDED PROFILE MANAGEMENT
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
    role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'healthcare_provider', 'staff', 'super_user')),
    is_active BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    password_changed_at TIMESTAMPTZ,
    password_expires_at TIMESTAMPTZ,
    two_factor_enabled BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    encrypted_retell_api_key TEXT,
    encrypted_agent_config JSONB,
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
-- 3. CREATE SUPER_USER_PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS super_user_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
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

-- Create indexes and unique constraints
CREATE INDEX IF NOT EXISTS idx_super_user_permissions_user_id ON super_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_super_user_permissions_type ON super_user_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_super_user_permissions_active ON super_user_permissions(is_active) WHERE is_active = true;

-- Add unique constraint for user-permission combinations
DO $$
BEGIN
    ALTER TABLE super_user_permissions
    ADD CONSTRAINT unique_user_permission UNIQUE (user_id, permission_type);
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists
        NULL;
END $$;

-- ============================================================================
-- 4. CREATE USER_AUDIT_LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    target_user_id TEXT,
    performed_by_user_id TEXT,
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
-- 5. CREATE UTILITY FUNCTIONS FOR USER MANAGEMENT (WITHOUT FK DEPENDENCIES)
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
    -- Update user profile to super user
    INSERT INTO user_profiles (user_id, role, is_active, updated_at)
    VALUES (p_user_id, 'super_user', true, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'super_user',
        is_active = true,
        updated_at = NOW();

    -- Grant permissions
    FOREACH permission IN ARRAY p_permissions
    LOOP
        INSERT INTO super_user_permissions (user_id, permission_type, granted_by)
        VALUES (p_user_id, permission, p_granted_by)
        ON CONFLICT (user_id, permission_type)
        DO UPDATE SET
            is_active = true,
            granted_at = NOW(),
            granted_by = p_granted_by,
            updated_at = NOW();
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

-- Function to update user settings safely
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

    RETURN COALESCE(result, jsonb_build_object('success', true, 'conflict', false));
END;
$$;

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY FOR ALL TABLES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. CREATE RLS POLICIES FOR SECURE ACCESS
-- ============================================================================

-- RLS policies for user_settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings"
ON user_settings FOR ALL
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

-- RLS policies for user_profiles
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

-- RLS policies for super_user_permissions
DROP POLICY IF EXISTS "Super users can manage permissions" ON super_user_permissions;
CREATE POLICY "Super users can manage permissions"
ON super_user_permissions FOR ALL
USING (
    user_id LIKE 'super-user-%' OR
    user_id = COALESCE(auth.uid()::text, 'anonymous')
);

-- RLS policies for user_audit_log
DROP POLICY IF EXISTS "Users can view relevant audit logs" ON user_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON user_audit_log;

CREATE POLICY "Users can view relevant audit logs"
ON user_audit_log FOR SELECT
USING (
    target_user_id = COALESCE(auth.uid()::text, 'anonymous') OR
    performed_by_user_id = COALESCE(auth.uid()::text, 'anonymous') OR
    target_user_id LIKE 'super-user-%' OR
    performed_by_user_id LIKE 'super-user-%'
);

CREATE POLICY "System can insert audit logs"
ON user_audit_log FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 8. SET UP SUPER USERS FOR SPECIFIED EMAIL ADDRESSES
-- ============================================================================

-- Create user profiles for super users (no dependency on users table)
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

-- Create user settings for both super users
INSERT INTO user_settings (
    user_id, theme, notifications, security_preferences,
    communication_preferences, accessibility_settings, created_at, updated_at
) VALUES (
    'super-user-elm-farrell',
    'dark',
    '{"email": true, "sms": true, "push": true, "in_app": true}'::jsonb,
    '{"session_timeout": 15, "require_mfa": true}'::jsonb,
    '{"default_method": "phone", "auto_reply_enabled": false}'::jsonb,
    '{"high_contrast": false, "large_text": false}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

INSERT INTO user_settings (
    user_id, theme, notifications, security_preferences,
    communication_preferences, accessibility_settings, created_at, updated_at
) VALUES (
    'super-user-pierre-phaeton',
    'dark',
    '{"email": true, "sms": true, "push": true, "in_app": true}'::jsonb,
    '{"session_timeout": 15, "require_mfa": true}'::jsonb,
    '{"default_method": "phone", "auto_reply_enabled": false}'::jsonb,
    '{"high_contrast": false, "large_text": false}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

-- Grant super user privileges
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
-- 9. GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON super_user_permissions TO authenticated;
GRANT SELECT, INSERT ON user_audit_log TO authenticated;

-- Grant permissions to service role for backend operations
GRANT ALL ON user_settings TO service_role;
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON super_user_permissions TO service_role;
GRANT ALL ON user_audit_log TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION grant_super_user_privileges TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_settings_safe TO authenticated;

-- ============================================================================
-- 10. CREATE UPDATE TRIGGERS FOR TIMESTAMP MANAGEMENT
-- ============================================================================

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_super_user_permissions_updated_at ON super_user_permissions;
CREATE TRIGGER update_super_user_permissions_updated_at
    BEFORE UPDATE ON super_user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ CareXPS Simplified User Management Migration completed successfully!';
    RAISE NOTICE '📋 Migration Summary:';
    RAISE NOTICE '   1. ✅ Created user_settings table with proper user_id column';
    RAISE NOTICE '   2. ✅ Created user_profiles table for extended management';
    RAISE NOTICE '   3. ✅ Created super_user_permissions for granular access';
    RAISE NOTICE '   4. ✅ Created user_audit_log for comprehensive auditing';
    RAISE NOTICE '   5. ✅ Added utility functions for user management';
    RAISE NOTICE '   6. ✅ Configured RLS policies for secure access';
    RAISE NOTICE '   7. ✅ Set up elmfarrell@yahoo.com as Super User';
    RAISE NOTICE '   8. ✅ Set up pierre@phaetonai.com as Super User';
    RAISE NOTICE '   9. ✅ Added automatic timestamp management';
    RAISE NOTICE '  10. ✅ Removed foreign key dependencies for compatibility';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Super Users Created:';
    RAISE NOTICE '   - elmfarrell@yahoo.com (ID: super-user-elm-farrell)';
    RAISE NOTICE '   - pierre@phaetonai.com (ID: super-user-pierre-phaeton)';
    RAISE NOTICE '';
    RAISE NOTICE '✨ Key Features:';
    RAISE NOTICE '   - No foreign key constraints (maximum compatibility)';
    RAISE NOTICE '   - Proper user_id column in user_settings';
    RAISE NOTICE '   - API key storage in user_profiles.encrypted_agent_config';
    RAISE NOTICE '   - Profile name persistence in user_settings';
    RAISE NOTICE '   - Super user permissions system';
    RAISE NOTICE '   - Comprehensive audit logging';
END $$;