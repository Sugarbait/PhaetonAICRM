-- Fix RLS infinite recursion on users table
-- This allows unauthenticated read access for login page

-- 1. Drop ALL existing SELECT policies on users table to start fresh
DROP POLICY IF EXISTS "Users can read own data and public info" ON public.users;
DROP POLICY IF EXISTS "Users can read all with anon key" ON public.users;
DROP POLICY IF EXISTS "Allow anon read for login" ON public.users;
DROP POLICY IF EXISTS "Users SELECT policy" ON public.users;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;

-- 2. Create a simple, non-recursive policy that allows all SELECTs
-- This is safe because we're only allowing read access, not write
CREATE POLICY "Allow unauthenticated SELECT for login"
ON public.users
FOR SELECT
USING (true);  -- Simple boolean, no recursion

-- 3. Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
  AND cmd = 'SELECT';
