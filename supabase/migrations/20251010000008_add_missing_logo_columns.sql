-- ================================================
-- Add Missing Logo Columns - October 10, 2025
-- ================================================
-- Simplified migration: Just add missing columns

-- Add header_logo column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_settings' AND column_name = 'header_logo'
  ) THEN
    ALTER TABLE company_settings ADD COLUMN header_logo TEXT;
    RAISE NOTICE '✅ Added header_logo column';
  ELSE
    RAISE NOTICE '✓ header_logo column already exists';
  END IF;
END $$;

-- Add favicon column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_settings' AND column_name = 'favicon'
  ) THEN
    ALTER TABLE company_settings ADD COLUMN favicon TEXT;
    RAISE NOTICE '✅ Added favicon column';
  ELSE
    RAISE NOTICE '✓ favicon column already exists';
  END IF;
END $$;

-- Add category column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_settings' AND column_name = 'category'
  ) THEN
    ALTER TABLE company_settings ADD COLUMN category TEXT DEFAULT 'branding';
    RAISE NOTICE '✅ Added category column';
  ELSE
    RAISE NOTICE '✓ category column already exists';
  END IF;
END $$;

-- ================================================
-- Fix storage bucket RLS policies
-- ================================================

-- Drop existing upload-related policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow super user uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated users to upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete company logos" ON storage.objects;

-- Drop existing read policies
DROP POLICY IF EXISTS "Anyone can read company logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to company logos" ON storage.objects;

-- Create fresh permissive policies
CREATE POLICY "authenticated_upload_logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "authenticated_update_logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-logos');

CREATE POLICY "authenticated_delete_logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-logos');

CREATE POLICY "public_read_logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'company-logos');

-- ================================================
-- Fix company_settings table RLS
-- ================================================

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can read their own settings" ON company_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON company_settings;
DROP POLICY IF EXISTS "Super users can read all settings" ON company_settings;
DROP POLICY IF EXISTS "Super users can insert all settings" ON company_settings;
DROP POLICY IF EXISTS "Super users can update all settings" ON company_settings;
DROP POLICY IF EXISTS "Authenticated users can read company settings" ON company_settings;
DROP POLICY IF EXISTS "Authenticated users can insert company settings" ON company_settings;
DROP POLICY IF EXISTS "Authenticated users can update company settings" ON company_settings;

-- Create simple permissive policies
CREATE POLICY "authenticated_read_settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_settings"
  ON company_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_settings"
  ON company_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- ================================================
-- Verification
-- ================================================

-- Simple verification without assuming column names
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully';
  RAISE NOTICE 'Columns should now exist: header_logo, favicon, category';
  RAISE NOTICE 'Storage policies created for authenticated users';
  RAISE NOTICE 'Table policies allow authenticated insert/update';
END $$;
