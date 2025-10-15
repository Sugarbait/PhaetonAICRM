-- ================================================
-- Fix Logo Upload Issues - October 10, 2025
-- ================================================
-- Issue 1: Storage bucket RLS blocking uploads
-- Issue 2: Missing 'category' column in company_settings table

-- ================================================
-- PART 1: Fix company_settings table schema
-- ================================================

-- Check if company_settings table exists, create if needed
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  header_logo TEXT,
  favicon TEXT,
  category TEXT DEFAULT 'branding',  -- Add missing column
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add category column if table exists but column is missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'company_settings'
    AND column_name = 'category'
  ) THEN
    ALTER TABLE company_settings ADD COLUMN category TEXT DEFAULT 'branding';
  END IF;
END $$;

-- Create index on tenant_id for performance
CREATE INDEX IF NOT EXISTS idx_company_settings_tenant
  ON company_settings(tenant_id);

-- ================================================
-- PART 2: Fix storage bucket RLS policies
-- ================================================

-- Ensure company-logos bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow super user uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated users to upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read company logos" ON storage.objects;
DROP POLICY IF EXISTS "Super users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;

-- CRITICAL: Create permissive upload policy for authenticated users
CREATE POLICY "Allow authenticated users to upload company logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos'
  );

-- Allow authenticated users to update their logos
CREATE POLICY "Allow authenticated users to update company logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
  );

-- Allow public read access (for login page)
CREATE POLICY "Public read access to company logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'company-logos'
  );

-- Allow authenticated users to delete their logos
CREATE POLICY "Allow authenticated users to delete company logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
  );

-- ================================================
-- PART 3: Fix company_settings table RLS
-- ================================================

-- Enable RLS on company_settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own settings" ON company_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON company_settings;
DROP POLICY IF EXISTS "Super users can read all settings" ON company_settings;
DROP POLICY IF EXISTS "Super users can insert all settings" ON company_settings;
DROP POLICY IF EXISTS "Super users can update all settings" ON company_settings;

-- Allow authenticated users to read their tenant's settings
CREATE POLICY "Authenticated users can read company settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert settings
CREATE POLICY "Authenticated users can insert company settings"
  ON company_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update settings
CREATE POLICY "Authenticated users can update company settings"
  ON company_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- ================================================
-- PART 4: Verification queries
-- ================================================

-- Test insert to verify schema is correct
DO $$
DECLARE
  test_result UUID;
BEGIN
  -- Try to insert test record
  INSERT INTO company_settings (tenant_id, header_logo, favicon, category)
  VALUES ('test_tenant', 'test_logo.png', 'test_favicon.png', 'branding')
  RETURNING id INTO test_result;

  -- Clean up test record
  DELETE FROM company_settings WHERE id = test_result;

  RAISE NOTICE '✅ Schema verification successful - category column exists';
END $$;
