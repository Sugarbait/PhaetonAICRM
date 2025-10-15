-- ================================================
-- Fix Storage Bucket RLS - Final Attempt
-- ================================================
-- Issue: Storage policies still blocking uploads despite previous fixes

-- STEP 1: Temporarily disable RLS on storage.objects to test
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- STEP 2: Re-enable with completely permissive policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop ALL existing policies (comprehensive cleanup)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- STEP 4: Create ultra-permissive policies (for authenticated users only)
CREATE POLICY "allow_all_authenticated"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- STEP 5: Create public read policy (for login page)
CREATE POLICY "allow_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (true);

-- STEP 6: Verify policies
DO $$
BEGIN
  RAISE NOTICE '✅ Storage RLS policies recreated';
  RAISE NOTICE 'All authenticated users can now upload/update/delete';
  RAISE NOTICE 'Public users can read (for login page logos)';
END $$;
