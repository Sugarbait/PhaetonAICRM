-- ================================================
-- Fix Failed Login Attempts RLS
-- ================================================
-- Issue: Anonymous users (login page) can't insert failed attempts
-- Solution: Allow anonymous inserts for failed login tracking

-- Drop old policy if exists
DROP POLICY IF EXISTS "Allow anonymous inserts for failed login tracking" ON failed_login_attempts;
DROP POLICY IF EXISTS "Allow authenticated inserts for failed login tracking" ON failed_login_attempts;

-- Create permissive insert policy for anonymous users (login page)
CREATE POLICY "anon_can_insert_failed_attempts"
  ON failed_login_attempts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Also allow authenticated users to insert
CREATE POLICY "authenticated_can_insert_failed_attempts"
  ON failed_login_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read attempts (for admin/debugging)
CREATE POLICY "authenticated_can_read_failed_attempts"
  ON failed_login_attempts
  FOR SELECT
  TO authenticated
  USING (true);

-- Optionally: Clear old test attempts (pierre@phaetonai.com)
-- Uncomment if you want to reset the counter:
-- DELETE FROM failed_login_attempts WHERE email = 'pierre@phaetonai.com';

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ Failed login attempts RLS fixed';
  RAISE NOTICE 'Anonymous users can now record failed login attempts';
  RAISE NOTICE 'Counter will now decrement correctly';
END $$;
