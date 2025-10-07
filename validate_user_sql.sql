-- Validation script for the user INSERT statements
-- This script validates the SQL syntax and data types

-- Test 1: Validate UUID format
SELECT
    '550e8400-e29b-41d4-a716-446655440001'::uuid as super_user_uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid as pierre_user_uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid as guest_user_uuid;

-- Test 2: Validate enum values exist
SELECT
    'admin'::user_role as admin_role,
    'healthcare_provider'::user_role as healthcare_role,
    'staff'::user_role as staff_role;

-- Test 3: Validate JSONB format
SELECT
    '{"description": "System administrator", "created_by": "system"}'::jsonb as valid_metadata;

-- Test 4: Check if we can do a dry run (this won't actually insert due to conflicts)
EXPLAIN (FORMAT TEXT)
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
);

-- If all the above queries run without error, the SQL is valid for the schema