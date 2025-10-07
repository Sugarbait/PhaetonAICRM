-- Corrected SQL for CareXPS users table
-- Based on actual table schema with required fields

-- Insert users with proper UUIDs and required fields
INSERT INTO users (
    id,
    username,
    email,
    password_hash,
    first_name,
    last_name,
    role,
    phi_access_level,
    is_mfa_enabled,
    mfa_enabled,
    totp_enabled,
    is_active,
    email_verified,
    training_completed,
    failed_login_attempts,
    created_at,
    updated_at
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'super-user-456',
    'elmfarrell@yahoo.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Password: "password" (bcrypt hash)
    'Super',
    'User',
    'admin',
    'full',
    true,
    true,
    false,
    true,
    true,
    true,
    0,
    NOW(),
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'pierre-user-789',
    'pierre@phaetonai.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Password: "password" (bcrypt hash)
    'Pierre',
    'Admin',
    'admin',
    'full',
    true,
    true,
    false,
    true,
    true,
    true,
    0,
    NOW(),
    NOW()
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'guest-user-456',
    'guest@email.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Password: "password" (bcrypt hash)
    'Guest',
    'User',
    'staff',
    'limited',
    true,
    true,
    false,
    true,
    true,
    false,
    0,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW(),
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name
ON CONFLICT (email) DO UPDATE SET
    updated_at = NOW(),
    id = EXCLUDED.id,
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

-- Create corresponding user profiles
INSERT INTO user_profiles (user_id, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

-- Create default user settings (HIPAA-compliant)
INSERT INTO user_settings (user_id, setting_key, setting_value, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'theme', '"light"', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'session_timeout', '15', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'cross_device_sync', 'true', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'theme', '"light"', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'session_timeout', '15', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'cross_device_sync', 'true', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'theme', '"light"', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'session_timeout', '15', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'cross_device_sync', 'true', NOW(), NOW())
ON CONFLICT (user_id, setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();