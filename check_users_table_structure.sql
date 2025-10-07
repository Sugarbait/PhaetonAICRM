-- Check the actual users table structure
-- Run this in your Supabase SQL Editor to verify current schema

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if the table exists and has data
SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    MAX(created_at) as latest_user_created
FROM users;

-- Check existing user IDs to avoid conflicts
SELECT id, email, name, role, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;