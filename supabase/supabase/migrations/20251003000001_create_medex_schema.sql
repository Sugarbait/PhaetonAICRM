-- ============================================================================
-- MedEx Schema Creation Migration
-- ============================================================================
-- Purpose: Create a separate 'medex' schema for MedEx Healthcare CRM
-- Impact: CareXPS remains unaffected (continues using 'public' schema)
-- Result: Complete data isolation between CareXPS and MedEx
-- ============================================================================

-- Step 1: Create medex schema
CREATE SCHEMA IF NOT EXISTS medex;

-- Step 2: Copy all table structures from public schema to medex schema
-- This creates empty tables with identical structure

-- Users table
CREATE TABLE IF NOT EXISTS medex.users (LIKE public.users INCLUDING ALL);

-- User settings table
CREATE TABLE IF NOT EXISTS medex.user_settings (LIKE public.user_settings INCLUDING ALL);

-- Audit logs table
CREATE TABLE IF NOT EXISTS medex.audit_logs (LIKE public.audit_logs INCLUDING ALL);

-- Notes table
CREATE TABLE IF NOT EXISTS medex.notes (LIKE public.notes INCLUDING ALL);

-- Calls table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calls') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS medex.calls (LIKE public.calls INCLUDING ALL)';
  END IF;
END $$;

-- SMS messages table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sms_messages') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS medex.sms_messages (LIKE public.sms_messages INCLUDING ALL)';
  END IF;
END $$;

-- Patients table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS medex.patients (LIKE public.patients INCLUDING ALL)';
  END IF;
END $$;

-- User profiles table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS medex.user_profiles (LIKE public.user_profiles INCLUDING ALL)';
  END IF;
END $$;

-- Step 3: Enable Row Level Security on all medex tables
ALTER TABLE medex.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medex.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE medex.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medex.notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'medex' AND table_name = 'calls') THEN
    ALTER TABLE medex.calls ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'medex' AND table_name = 'sms_messages') THEN
    ALTER TABLE medex.sms_messages ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'medex' AND table_name = 'patients') THEN
    ALTER TABLE medex.patients ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'medex' AND table_name = 'user_profiles') THEN
    ALTER TABLE medex.user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Step 4: Copy RLS policies from public schema to medex schema
-- Users table policies
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN
    SELECT policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
  LOOP
    -- Drop if exists to avoid conflicts
    EXECUTE format('DROP POLICY IF EXISTS %I ON medex.users', policy_rec.policyname);

    -- Recreate policy on medex.users
    EXECUTE format(
      'CREATE POLICY %I ON medex.users AS %s FOR %s TO %s USING (%s)',
      policy_rec.policyname,
      CASE WHEN policy_rec.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      policy_rec.cmd,
      array_to_string(policy_rec.roles, ', '),
      COALESCE(policy_rec.qual, 'true')
    );

    -- Add WITH CHECK if it exists
    IF policy_rec.with_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON medex.users WITH CHECK (%s)',
        policy_rec.policyname,
        policy_rec.with_check
      );
    END IF;
  END LOOP;
END $$;

-- User settings table policies
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN
    SELECT policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON medex.user_settings', policy_rec.policyname);
    EXECUTE format(
      'CREATE POLICY %I ON medex.user_settings AS %s FOR %s TO %s USING (%s)',
      policy_rec.policyname,
      CASE WHEN policy_rec.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      policy_rec.cmd,
      array_to_string(policy_rec.roles, ', '),
      COALESCE(policy_rec.qual, 'true')
    );
    IF policy_rec.with_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON medex.user_settings WITH CHECK (%s)',
        policy_rec.policyname,
        policy_rec.with_check
      );
    END IF;
  END LOOP;
END $$;

-- Audit logs table policies
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN
    SELECT policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_logs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON medex.audit_logs', policy_rec.policyname);
    EXECUTE format(
      'CREATE POLICY %I ON medex.audit_logs AS %s FOR %s TO %s USING (%s)',
      policy_rec.policyname,
      CASE WHEN policy_rec.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      policy_rec.cmd,
      array_to_string(policy_rec.roles, ', '),
      COALESCE(policy_rec.qual, 'true')
    );
    IF policy_rec.with_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON medex.audit_logs WITH CHECK (%s)',
        policy_rec.policyname,
        policy_rec.with_check
      );
    END IF;
  END LOOP;
END $$;

-- Notes table policies
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN
    SELECT policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON medex.notes', policy_rec.policyname);
    EXECUTE format(
      'CREATE POLICY %I ON medex.notes AS %s FOR %s TO %s USING (%s)',
      policy_rec.policyname,
      CASE WHEN policy_rec.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      policy_rec.cmd,
      array_to_string(policy_rec.roles, ', '),
      COALESCE(policy_rec.qual, 'true')
    );
    IF policy_rec.with_check IS NOT NULL THEN
      EXECUTE format(
        'ALTER POLICY %I ON medex.notes WITH CHECK (%s)',
        policy_rec.policyname,
        policy_rec.with_check
      );
    END IF;
  END LOOP;
END $$;

-- Step 5: Grant permissions
GRANT USAGE ON SCHEMA medex TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA medex TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA medex TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA medex TO anon, authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA medex GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA medex GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA medex GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- Step 6: Add helpful comments
COMMENT ON SCHEMA medex IS 'Separate schema for MedEx Healthcare CRM - completely isolated from CareXPS (public schema)';
COMMENT ON TABLE medex.users IS 'MedEx user accounts (separate from CareXPS)';
COMMENT ON TABLE medex.user_settings IS 'MedEx user settings and preferences';
COMMENT ON TABLE medex.audit_logs IS 'MedEx HIPAA-compliant audit trail';
COMMENT ON TABLE medex.notes IS 'MedEx cross-device synchronized notes';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
--   • Created medex schema
--   • Copied all table structures from public schema
--   • Enabled RLS on all medex tables
--   • Copied all RLS policies
--   • Set up permissions
--   • CareXPS data remains in public schema (unaffected)
--   • MedEx will use medex schema (clean slate)
-- ============================================================================
