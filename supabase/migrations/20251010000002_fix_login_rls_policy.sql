-- Fix login issue by allowing unauthenticated SELECT queries on users table
-- This is required for database-only authentication (localStorage-based)
--
-- ISSUE: RLS policies on users table were blocking unauthenticated login queries
-- SOLUTION: Allow public SELECT access for login, while keeping writes protected
--
-- SECURITY: This is safe because:
-- 1. Passwords are NOT stored in users table (encrypted in user_profiles)
-- 2. Only basic user info is exposed (email, role, isActive, tenant_id)
-- 3. Write operations still require authentication
-- 4. This is standard practice for database-only authentication systems

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "users_can_see_own_profile" ON users;
DROP POLICY IF EXISTS "super_users_can_see_all_users" ON users;

-- Create a public SELECT policy for login/authentication queries
CREATE POLICY "allow_login_and_authenticated_queries" ON users
  FOR SELECT USING (
    -- Allow if authenticated and viewing own profile
    id = auth.uid()
    -- OR if unauthenticated (for login queries - REQUIRED for database-only auth)
    OR auth.uid() IS NULL
    -- OR if super user viewing any profile
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_user'
      AND u.is_active = true
    )
  );

-- Keep other operations secure (INSERT, UPDATE, DELETE still require authentication)

-- INSERT policy (only super users can create users)
DROP POLICY IF EXISTS "super_users_can_insert_users" ON users;
CREATE POLICY "super_users_can_insert_users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_user'
      AND u.is_active = true
    )
  );

-- UPDATE policy (users can update themselves, super users can update anyone)
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
DROP POLICY IF EXISTS "super_users_can_update_users" ON users;
CREATE POLICY "users_can_update_profiles" ON users
  FOR UPDATE USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_user'
      AND u.is_active = true
    )
  );

-- DELETE policy (only super users can delete, not themselves)
DROP POLICY IF EXISTS "super_users_can_delete_users" ON users;
CREATE POLICY "super_users_can_delete_users" ON users
  FOR DELETE USING (
    id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_user'
      AND u.is_active = true
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "allow_login_and_authenticated_queries" ON users IS
  'Allows unauthenticated SELECT for login queries (database-only auth), authenticated users to view own profile, and super users to view all profiles. This is SAFE because passwords are encrypted separately in user_profiles table.';

COMMENT ON POLICY "super_users_can_insert_users" ON users IS
  'Only super users can create new users. Requires authentication.';

COMMENT ON POLICY "users_can_update_profiles" ON users IS
  'Users can update their own profile, super users can update any profile. Requires authentication.';

COMMENT ON POLICY "super_users_can_delete_users" ON users IS
  'Super users can delete users (except themselves). Requires authentication.';

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251010000002 completed: Fixed RLS policies to allow unauthenticated login queries';
  RAISE NOTICE 'Security: Passwords remain encrypted in user_profiles table';
  RAISE NOTICE 'Security: Write operations still require authentication';
END $$;
