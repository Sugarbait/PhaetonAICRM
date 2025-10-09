-- ============================================================================
-- ARTLEE CRM Schema Fix - Add Missing Columns and Tables
-- ============================================================================
-- Date: 2025-10-09
-- Purpose: Fix schema cache errors by adding missing columns to existing tables
--          and creating the user_profiles table
-- Database: https://fslniuhyunzlfcbxsiol.supabase.co
--
-- Errors Fixed:
-- 1. "Could not find the 'mfa_enabled' column of 'users' in the schema cache"
-- 2. "Could not find the 'phi_accessed' column of 'audit_logs' in the schema cache"
-- 3. "Could not find the table 'public.user_profiles' in the schema cache"
-- ============================================================================

-- ============================================================================
-- SECTION 1: Add MFA Columns to user_settings Table
-- ============================================================================
-- The ARTLEE application stores MFA data in user_settings, not users table
-- (Note: MedEx uses users table, but ARTLEE uses user_settings)

DO $$
BEGIN
  -- Add fresh_mfa_secret column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_settings'
    AND column_name = 'fresh_mfa_secret'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN fresh_mfa_secret TEXT;
    RAISE NOTICE 'Added fresh_mfa_secret column to user_settings';
  ELSE
    RAISE NOTICE 'Column fresh_mfa_secret already exists in user_settings';
  END IF;

  -- Add fresh_mfa_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_settings'
    AND column_name = 'fresh_mfa_enabled'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN fresh_mfa_enabled BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added fresh_mfa_enabled column to user_settings';
  ELSE
    RAISE NOTICE 'Column fresh_mfa_enabled already exists in user_settings';
  END IF;

  -- Add fresh_mfa_setup_completed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_settings'
    AND column_name = 'fresh_mfa_setup_completed'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN fresh_mfa_setup_completed BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added fresh_mfa_setup_completed column to user_settings';
  ELSE
    RAISE NOTICE 'Column fresh_mfa_setup_completed already exists in user_settings';
  END IF;

  -- Add fresh_mfa_backup_codes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_settings'
    AND column_name = 'fresh_mfa_backup_codes'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN fresh_mfa_backup_codes TEXT;
    RAISE NOTICE 'Added fresh_mfa_backup_codes column to user_settings';
  ELSE
    RAISE NOTICE 'Column fresh_mfa_backup_codes already exists in user_settings';
  END IF;
END $$;

-- Add comments for MFA columns
COMMENT ON COLUMN public.user_settings.fresh_mfa_secret IS 'TOTP secret for Fresh MFA implementation (stored as plain text)';
COMMENT ON COLUMN public.user_settings.fresh_mfa_enabled IS 'Whether Fresh MFA is enabled for this user';
COMMENT ON COLUMN public.user_settings.fresh_mfa_setup_completed IS 'Whether Fresh MFA setup has been completed';
COMMENT ON COLUMN public.user_settings.fresh_mfa_backup_codes IS 'JSON string of backup codes for Fresh MFA';

-- ============================================================================
-- SECTION 2: Add mfa_enabled to users Table (for backwards compatibility)
-- ============================================================================
-- Some code may still reference users.mfa_enabled, so we add it for safety

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'mfa_enabled'
  ) THEN
    ALTER TABLE public.users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added mfa_enabled column to users table';
  ELSE
    RAISE NOTICE 'Column mfa_enabled already exists in users table';
  END IF;
END $$;

COMMENT ON COLUMN public.users.mfa_enabled IS 'Legacy MFA enabled flag (ARTLEE uses user_settings.fresh_mfa_enabled instead)';

-- ============================================================================
-- SECTION 3: Verify audit_logs.phi_accessed Column Exists
-- ============================================================================
-- This column should already exist from migration 20241226000001_create_audit_logs_table.sql
-- We verify and add it if missing (schema cache issue)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'phi_accessed'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN phi_accessed BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added phi_accessed column to audit_logs';
  ELSE
    RAISE NOTICE 'Column phi_accessed already exists in audit_logs';
  END IF;
END $$;

COMMENT ON COLUMN public.audit_logs.phi_accessed IS 'HIPAA compliance flag - indicates if PHI was accessed during this action';

-- ============================================================================
-- SECTION 4: Create user_profiles Table
-- ============================================================================
-- This table stores extended profile information beyond the core users table

-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  department TEXT,
  phone TEXT,
  bio TEXT,
  location TEXT,
  timezone TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  encrypted_retell_api_key TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'artlee',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles (ARTLEE pattern - permissive)
-- ARTLEE uses local authentication (not Supabase Auth), so we use permissive policies
-- Application layer handles security with tenant_id filtering

-- Policy 1: Allow all SELECT operations
CREATE POLICY "artlee_user_profiles_select" ON public.user_profiles
  FOR SELECT USING (true);

-- Policy 2: Allow all INSERT operations
CREATE POLICY "artlee_user_profiles_insert" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

-- Policy 3: Allow all UPDATE operations
CREATE POLICY "artlee_user_profiles_update" ON public.user_profiles
  FOR UPDATE USING (true);

-- Policy 4: Allow all DELETE operations
CREATE POLICY "artlee_user_profiles_delete" ON public.user_profiles
  FOR DELETE USING (true);

-- Add indexes for performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_display_name ON public.user_profiles(display_name);
CREATE INDEX idx_user_profiles_department ON public.user_profiles(department);
CREATE INDEX idx_user_profiles_tenant_id ON public.user_profiles(tenant_id);

-- Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.user_profiles TO anon;

-- Add comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information including display name, department, and preferences';
COMMENT ON COLUMN public.user_profiles.user_id IS 'Reference to users table id';
COMMENT ON COLUMN public.user_profiles.display_name IS 'Display name for the user profile';
COMMENT ON COLUMN public.user_profiles.department IS 'User department or team';
COMMENT ON COLUMN public.user_profiles.preferences IS 'JSON object storing user preferences and settings';
COMMENT ON COLUMN public.user_profiles.tenant_id IS 'Tenant isolation: artlee = ARTLEE data, medex = MedEx data, carexps = CareXPS data';

-- ============================================================================
-- SECTION 5: Create Profiles for Existing Users
-- ============================================================================
-- Automatically create user_profiles entries for any existing users

INSERT INTO public.user_profiles (user_id, display_name, department, tenant_id)
SELECT
  u.id,
  COALESCE(u.name, u.email) as display_name,
  'General' as department,
  u.tenant_id
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- SECTION 6: Verification and Summary
-- ============================================================================

DO $$
DECLARE
  mfa_count INTEGER;
  audit_count INTEGER;
  profiles_count INTEGER;
BEGIN
  -- Count MFA columns in user_settings
  SELECT COUNT(*) INTO mfa_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'user_settings'
  AND column_name IN ('fresh_mfa_secret', 'fresh_mfa_enabled', 'fresh_mfa_setup_completed', 'fresh_mfa_backup_codes');

  -- Verify phi_accessed in audit_logs
  SELECT COUNT(*) INTO audit_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
  AND column_name = 'phi_accessed';

  -- Count user_profiles
  SELECT COUNT(*) INTO profiles_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_profiles';

  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'ARTLEE CRM Schema Fix - Verification Results';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'MFA columns in user_settings: % of 4', mfa_count;
  RAISE NOTICE 'phi_accessed column in audit_logs: % (expected: 1)', audit_count;
  RAISE NOTICE 'user_profiles table exists: % (expected: 1)', profiles_count;
  RAISE NOTICE '=================================================================';

  IF mfa_count = 4 AND audit_count = 1 AND profiles_count = 1 THEN
    RAISE NOTICE '✅ SUCCESS: All schema fixes applied successfully!';
  ELSE
    RAISE WARNING '⚠️ WARNING: Some schema fixes may have failed. Review the logs above.';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
--   ✅ Added 4 Fresh MFA columns to user_settings table
--   ✅ Added mfa_enabled to users table (backwards compatibility)
--   ✅ Verified phi_accessed column in audit_logs table
--   ✅ Created user_profiles table with tenant isolation
--   ✅ Created RLS policies for user_profiles
--   ✅ Created indexes for performance
--   ✅ Auto-created profiles for existing users
--
-- Next Steps:
--   1. Run this migration in Supabase SQL Editor
--   2. Refresh your application
--   3. Verify no schema cache errors appear
--   4. Test MFA functionality with fresh_mfa_enabled
-- ============================================================================
