-- ============================================================================
-- Complete RLS Reset for User Registration
-- ============================================================================
-- Purpose: Drop ALL existing policies and create fresh ones for registration
-- Issue: Mixed policies from multiple migrations causing conflicts
-- Solution: Nuclear reset - drop everything, rebuild from scratch
-- ============================================================================

-- Step 1: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL possible existing policies (from all previous migrations)
DROP POLICY IF EXISTS "allow_login_and_authenticated_queries" ON users;
DROP POLICY IF EXISTS "super_users_can_insert_users" ON users;
DROP POLICY IF EXISTS "users_can_update_profiles" ON users;
DROP POLICY IF EXISTS "super_users_can_delete_users" ON users;
DROP POLICY IF EXISTS "users_can_see_own_profile" ON users;
DROP POLICY IF EXISTS "super_users_can_see_all_users" ON users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
DROP POLICY IF EXISTS "allow_anon_registration" ON users;
DROP POLICY IF EXISTS "service_role_full_access" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "anon_can_register" ON users;
DROP POLICY IF EXISTS "authenticated_can_select" ON users;
DROP POLICY IF EXISTS "authenticated_can_update_own" ON users;

-- Step 3: Create 4 SIMPLE, non-recursive policies

-- Policy 1: Allow anonymous INSERT (for registration)
CREATE POLICY "anon_can_register" ON public.users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy 2: Allow service_role full access
CREATE POLICY "service_role_full_access" ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 3: Allow SELECT queries (for login and authenticated access)
CREATE POLICY "users_can_select" ON public.users
  FOR SELECT
  USING (
    -- Allow if authenticated and viewing own profile
    id = auth.uid()
    -- OR if unauthenticated (for login queries)
    OR auth.uid() IS NULL
  );

-- Policy 4: Allow authenticated users to UPDATE their own row
CREATE POLICY "users_can_update_own" ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Step 4: Add documentation
COMMENT ON POLICY "anon_can_register" ON users IS
  'Allows anonymous users to register new accounts. No restrictions.';

COMMENT ON POLICY "service_role_full_access" ON users IS
  'Service role has full access for administrative operations.';

COMMENT ON POLICY "users_can_select" ON users IS
  'Allows authenticated users to view own profile, unauthenticated to query for login.';

COMMENT ON POLICY "users_can_update_own" ON users IS
  'Authenticated users can update their own profile only.';

-- Step 5: Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 6: Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Complete RLS reset completed';
  RAISE NOTICE '✅ All old policies dropped';
  RAISE NOTICE '✅ 4 new policies created';
  RAISE NOTICE '✅ Anonymous registration now enabled';
END $$;
