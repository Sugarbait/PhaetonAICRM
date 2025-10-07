-- Complete user initialization with UUIDs and related tables
-- This creates users and their associated settings, profiles, and permissions

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. INSERT USERS
-- ============================================================================

-- Super User (Admin)
INSERT INTO users (
    id,
    azure_ad_id,
    email,
    name,
    role,
    mfa_enabled,
    is_active,
    metadata
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'super-user-456-azure',
    'super@carexps.com',
    'Super User',
    'admin',
    true,
    true,
    '{"description": "System administrator with full access", "created_by": "system", "department": "IT"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    mfa_enabled = EXCLUDED.mfa_enabled,
    updated_at = NOW();

-- Pierre User (Healthcare Provider)
INSERT INTO users (
    id,
    azure_ad_id,
    email,
    name,
    role,
    mfa_enabled,
    is_active,
    metadata
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'pierre-user-789-azure',
    'pierre@carexps.com',
    'Pierre Healthcare',
    'healthcare_provider',
    true,
    true,
    '{"description": "Healthcare provider with patient access", "created_by": "system", "department": "Medical", "license_number": "HP12345"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    mfa_enabled = EXCLUDED.mfa_enabled,
    updated_at = NOW();

-- Guest User (Staff)
INSERT INTO users (
    id,
    azure_ad_id,
    email,
    name,
    role,
    mfa_enabled,
    is_active,
    metadata
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'guest-user-456-azure',
    'guest@carexps.com',
    'Guest User',
    'staff',
    false,
    true,
    '{"description": "Guest user with limited access", "created_by": "system", "department": "Support"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    mfa_enabled = EXCLUDED.mfa_enabled,
    updated_at = NOW();

-- ============================================================================
-- 2. CREATE USER PROFILES
-- ============================================================================

-- Super User Profile
INSERT INTO user_profiles (user_id) VALUES ('550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (user_id) DO NOTHING;

-- Pierre User Profile
INSERT INTO user_profiles (user_id) VALUES ('550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (user_id) DO NOTHING;

-- Guest User Profile
INSERT INTO user_profiles (user_id) VALUES ('550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 3. CREATE USER SETTINGS
-- ============================================================================

-- Super User Settings (Admin preferences)
INSERT INTO user_settings (
    user_id,
    theme,
    notifications,
    security_preferences,
    communication_preferences,
    device_sync_enabled
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'dark',
    '{
        "email": true,
        "sms": true,
        "push": true,
        "in_app": true,
        "call_alerts": true,
        "sms_alerts": true,
        "security_alerts": true
    }'::jsonb,
    '{
        "session_timeout": 1800,
        "require_mfa": true,
        "password_expiry_reminder": true,
        "login_notifications": true
    }'::jsonb,
    '{
        "default_method": "email",
        "auto_reply_enabled": false,
        "business_hours": {
            "enabled": true,
            "start": "08:00",
            "end": "18:00",
            "timezone": "America/New_York"
        }
    }'::jsonb,
    true
) ON CONFLICT (user_id) DO NOTHING;

-- Pierre User Settings (Healthcare provider preferences)
INSERT INTO user_settings (
    user_id,
    theme,
    notifications,
    security_preferences,
    communication_preferences,
    device_sync_enabled
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'auto',
    '{
        "email": true,
        "sms": true,
        "push": true,
        "in_app": true,
        "call_alerts": true,
        "sms_alerts": true,
        "security_alerts": true
    }'::jsonb,
    '{
        "session_timeout": 900,
        "require_mfa": true,
        "password_expiry_reminder": true,
        "login_notifications": true
    }'::jsonb,
    '{
        "default_method": "phone",
        "auto_reply_enabled": true,
        "business_hours": {
            "enabled": true,
            "start": "09:00",
            "end": "17:00",
            "timezone": "America/New_York"
        }
    }'::jsonb,
    true
) ON CONFLICT (user_id) DO NOTHING;

-- Guest User Settings (Basic preferences)
INSERT INTO user_settings (
    user_id,
    theme,
    notifications,
    security_preferences,
    communication_preferences,
    device_sync_enabled
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'light',
    '{
        "email": false,
        "sms": false,
        "push": false,
        "in_app": true,
        "call_alerts": false,
        "sms_alerts": false,
        "security_alerts": false
    }'::jsonb,
    '{
        "session_timeout": 600,
        "require_mfa": false,
        "password_expiry_reminder": false,
        "login_notifications": false
    }'::jsonb,
    '{
        "default_method": "phone",
        "auto_reply_enabled": false,
        "business_hours": {
            "enabled": false,
            "start": "09:00",
            "end": "17:00",
            "timezone": "America/New_York"
        }
    }'::jsonb,
    false
) ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 4. SET USER PERMISSIONS (for non-admin users)
-- ============================================================================

-- Pierre (Healthcare Provider) permissions
INSERT INTO user_permissions (user_id, resource, actions) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'patients', ARRAY['read', 'write', 'create']),
('550e8400-e29b-41d4-a716-446655440002', 'calls', ARRAY['read', 'write', 'create']),
('550e8400-e29b-41d4-a716-446655440002', 'sms_messages', ARRAY['read', 'write', 'create']),
('550e8400-e29b-41d4-a716-446655440002', 'notes', ARRAY['read', 'write', 'create'])
ON CONFLICT DO NOTHING;

-- Guest User (Limited permissions)
INSERT INTO user_permissions (user_id, resource, actions) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'patients', ARRAY['read']),
('550e8400-e29b-41d4-a716-446655440003', 'calls', ARRAY['read']),
('550e8400-e29b-41d4-a716-446655440003', 'notes', ARRAY['read'])
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Verify users were created
SELECT
    u.id,
    u.azure_ad_id,
    u.email,
    u.name,
    u.role,
    u.mfa_enabled,
    u.is_active,
    u.created_at,
    CASE WHEN up.user_id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_profile,
    CASE WHEN us.user_id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_settings
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_settings us ON u.id = us.user_id
WHERE u.id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003'
)
ORDER BY u.role, u.name;

-- Verify permissions
SELECT
    u.name,
    u.role,
    up.resource,
    up.actions
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003'
)
ORDER BY u.role, u.name, up.resource;

-- Summary
SELECT
    'USERS CREATED' as status,
    COUNT(*) as count
FROM users
WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003'
);