-- ============================================================================
-- VERIFICATION QUERIES FOR SUPER USER FIX
-- ============================================================================
-- Run these queries in Supabase SQL Editor to verify the fix works correctly
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CURRENT USERS TABLE
-- ============================================================================
-- This shows all existing users and their roles
SELECT
    id,
    email,
    name,
    role,
    is_active,
    metadata->'original_role' as metadata_original_role,
    tenant_id,
    created_at
FROM users
WHERE tenant_id = 'medex'
ORDER BY created_at DESC;

-- Count users by role
SELECT
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM users
WHERE tenant_id = 'medex'
GROUP BY role;

-- ============================================================================
-- STEP 2: FIX EXISTING USERS WITH INCORRECT ROLE
-- ============================================================================
-- If you have test users with 'admin' role that should be 'super_user',
-- update them with this query:

UPDATE users
SET
    role = 'super_user',
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{original_role}',
        '"super_user"'
    ),
    updated_at = NOW()
WHERE
    tenant_id = 'medex'
    AND role = 'admin'
    AND metadata->>'original_role' = 'super_user';

-- Verify the update
SELECT
    id,
    email,
    name,
    role,
    metadata->'original_role' as metadata_original_role,
    updated_at
FROM users
WHERE tenant_id = 'medex'
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================================================
-- STEP 3: DELETE INCORRECT TEST USERS (OPTIONAL)
-- ============================================================================
-- If you want to delete the incorrectly created admin users and start fresh:

-- First, check which users will be deleted (DRY RUN)
SELECT
    id,
    email,
    name,
    role,
    metadata->'original_role' as metadata_original_role,
    created_at
FROM users
WHERE
    tenant_id = 'medex'
    AND role = 'admin'
    AND metadata->>'original_role' = 'super_user';

-- If the above looks correct, uncomment and run this to delete:
/*
DELETE FROM users
WHERE
    tenant_id = 'medex'
    AND role = 'admin'
    AND metadata->>'original_role' = 'super_user';
*/

-- ============================================================================
-- STEP 4: VERIFY DATABASE SCHEMA SUPPORTS SUPER_USER
-- ============================================================================
-- Check the role constraint to confirm 'super_user' is allowed
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'role';

-- Check for any CHECK constraints on the role column
SELECT
    con.conname AS constraint_name,
    con.consrc AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE
    nsp.nspname = 'public'
    AND rel.relname = 'users'
    AND con.contype = 'c';

-- ============================================================================
-- STEP 5: TEST NEW USER CREATION
-- ============================================================================
-- After deploying the fix, create a test user to verify:

-- Check current user count (should be 0 for first user test)
SELECT COUNT(*) as total_users FROM users WHERE tenant_id = 'medex';

-- After creating a user through the UI, verify the role was stored correctly:
SELECT
    id,
    email,
    name,
    role,
    is_active,
    metadata->'original_role' as metadata_original_role,
    metadata->'created_via' as created_via,
    created_at
FROM users
WHERE tenant_id = 'medex'
ORDER BY created_at DESC
LIMIT 1;

-- Expected result for first user:
-- role: 'super_user' (NOT 'admin')
-- is_active: true
-- metadata_original_role: 'super_user'
-- created_via: 'user_management'

-- ============================================================================
-- STEP 6: VERIFY USER CAN DELETE OTHER USERS
-- ============================================================================
-- Log in as the super_user and try to delete a test user through the UI
-- Then verify the deletion was successful:

SELECT
    id,
    email,
    name,
    role,
    is_active
FROM users
WHERE tenant_id = 'medex'
ORDER BY created_at DESC;

-- ============================================================================
-- CLEANUP QUERIES (USE WITH CAUTION)
-- ============================================================================

-- Delete ALL users in medex tenant (DANGEROUS - only for testing)
-- UNCOMMENT ONLY IF YOU WANT TO START COMPLETELY FRESH
/*
DELETE FROM users WHERE tenant_id = 'medex';
*/

-- Verify table is empty
SELECT COUNT(*) as remaining_users FROM users WHERE tenant_id = 'medex';

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If you see users with role='admin' but metadata shows 'super_user':
-- This means the old code ran and converted the role incorrectly.
-- Use STEP 2 above to fix them, or STEP 3 to delete and recreate.

-- If you see errors when creating users:
-- Check the application console logs for the actual role values being sent.
-- The logs should show:
--   "Input role="super_user" → Database role="super_user""
-- NOT:
--   "Input role="super_user" → Database role="admin""

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================
-- ✅ First user created with role='super_user' in database
-- ✅ metadata.original_role='super_user'
-- ✅ is_active=true
-- ✅ User can access User Management page
-- ✅ User can delete other users
-- ✅ No more "Admin" role appearing for first user
