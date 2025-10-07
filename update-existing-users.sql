-- Update existing users with proper UUIDs for cross-device sync
-- This approach works with existing users in the database

-- Update existing users to use the mapped UUIDs
-- This will change their IDs to the deterministic UUIDs we need

UPDATE users SET
    id = '550e8400-e29b-41d4-a716-446655440001',
    username = 'super-user-456',
    updated_at = NOW()
WHERE email = 'elmfarrell@yahoo.com';

UPDATE users SET
    id = '550e8400-e29b-41d4-a716-446655440002',
    username = 'pierre-user-789',
    updated_at = NOW()
WHERE email = 'pierre@phaetonai.com';

UPDATE users SET
    id = '550e8400-e29b-41d4-a716-446655440003',
    username = 'guest-user-456',
    updated_at = NOW()
WHERE email = 'guest@email.com';

-- Update or create user profiles with new UUIDs
INSERT INTO user_profiles (user_id, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

-- Update or create user settings for cross-device sync (MFA KEPT ENABLED)
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

-- Verify the changes
SELECT id, username, email, first_name, last_name, is_active
FROM users
WHERE email IN ('elmfarrell@yahoo.com', 'pierre@phaetonai.com', 'guest@email.com')
ORDER BY email;