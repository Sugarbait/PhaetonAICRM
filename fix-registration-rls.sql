-- FIX REGISTRATION RLS POLICIES
-- This SQL script fixes the "infinite recursion detected in policy" error
-- that prevents user registration from working.
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard
-- 2. Go to your project: cpkslvmydfdevdftieck
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Create a new query
-- 5. Copy and paste this entire file
-- 6. Click "Run" button
-- 7. Test registration again

-- ==============================================================
-- STEP 1: Drop all existing RLS policies on users table
-- ==============================================================

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop all policies that might cause recursion
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'users' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.users CASCADE';
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- ==============================================================
-- STEP 2: Enable RLS on users table
-- ==============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- STEP 3: Create new RLS policies (NO RECURSION)
-- ==============================================================

-- Policy 1: Allow anonymous users to INSERT for registration
-- This is what allows the registration form to work
CREATE POLICY "allow_anon_registration"
ON public.users
FOR INSERT
TO anon
WITH CHECK (true);  -- Allow all INSERTs from anonymous users

COMMENT ON POLICY "allow_anon_registration" ON public.users IS
'Allows anonymous users to register new accounts via the registration form';

-- Policy 2: Allow service_role full access (for admin operations)
CREATE POLICY "service_role_full_access"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON POLICY "service_role_full_access" ON public.users IS
'Allows service role (backend) full access to users table for admin operations';

-- Policy 3: Allow authenticated users to SELECT their own profile only
-- Uses auth.uid() to avoid recursion
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

COMMENT ON POLICY "users_select_own" ON public.users IS
'Allows authenticated users to view their own profile only';

-- Policy 4: Allow authenticated users to UPDATE their own profile only
-- Uses auth.uid() to avoid recursion
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

COMMENT ON POLICY "users_update_own" ON public.users IS
'Allows authenticated users to update their own profile only';

-- ==============================================================
-- STEP 4: Verify policies were created
-- ==============================================================

SELECT
  policyname AS policy_name,
  cmd AS command,
  roles,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- ==============================================================
-- Expected Output:
-- ==============================================================
-- You should see 4 policies:
-- 1. allow_anon_registration (INSERT, anon)
-- 2. service_role_full_access (ALL, service_role)
-- 3. users_select_own (SELECT, authenticated)
-- 4. users_update_own (UPDATE, authenticated)
--
-- If you see these 4 policies, the fix is complete!
-- Try registering pierre@phaetonai.com again.
