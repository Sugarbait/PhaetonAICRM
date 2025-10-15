-- ================================================
-- FORCE FIX: Failed Login Attempts RLS
-- ================================================
-- More aggressive approach to fix RLS policies

-- Step 1: Temporarily disable RLS to clean up
ALTER TABLE failed_login_attempts DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'failed_login_attempts'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON failed_login_attempts';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Step 4: Create fresh, simple policies
CREATE POLICY "allow_anon_insert"
  ON failed_login_attempts
  AS PERMISSIVE
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_all"
  ON failed_login_attempts
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 5: Verify
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'failed_login_attempts';

    RAISE NOTICE '✅ RLS policies recreated';
    RAISE NOTICE 'Total policies: %', policy_count;
    RAISE NOTICE 'Anonymous users can now insert failed login attempts';
END $$;
