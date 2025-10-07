-- Corrected INSERT statements for users with specific UUIDs
-- These match the actual users table schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert users with specific UUIDs
-- Note: Using 'admin' role enum value as defined in the schema

-- 1. Super User (Admin)
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
    '{"description": "System administrator with full access", "created_by": "system"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    mfa_enabled = EXCLUDED.mfa_enabled,
    updated_at = NOW();

-- 2. Pierre User (Healthcare Provider)
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
    '{"description": "Healthcare provider with patient access", "created_by": "system"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    mfa_enabled = EXCLUDED.mfa_enabled,
    updated_at = NOW();

-- 3. Guest User (Staff)
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
    '{"description": "Guest user with limited access", "created_by": "system"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    mfa_enabled = EXCLUDED.mfa_enabled,
    updated_at = NOW();

-- Verify the inserts
SELECT
    id,
    azure_ad_id,
    email,
    name,
    role,
    mfa_enabled,
    is_active,
    created_at
FROM users
WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003'
)
ORDER BY role, name;