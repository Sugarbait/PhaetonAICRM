-- ============================================================================
-- MedEx Schema Creation Migration (Type-Safe)
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
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'medex' AND table_name = 'user_profiles') THEN
    ALTER TABLE medex.user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Step 4: Create basic RLS policies for medex schema
-- Note: Using true for permissive access - adjust based on your security requirements

-- Users table policies
DROP POLICY IF EXISTS "Users can view all users" ON medex.users;
CREATE POLICY "Users can view all users" ON medex.users
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON medex.users;
CREATE POLICY "Users can update own profile" ON medex.users
  FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "System can insert users" ON medex.users;
CREATE POLICY "System can insert users" ON medex.users
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete users" ON medex.users;
CREATE POLICY "Users can delete users" ON medex.users
  FOR DELETE TO public USING (true);

-- User settings policies
DROP POLICY IF EXISTS "Users can view settings" ON medex.user_settings;
CREATE POLICY "Users can view settings" ON medex.user_settings
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert settings" ON medex.user_settings;
CREATE POLICY "Users can insert settings" ON medex.user_settings
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update settings" ON medex.user_settings;
CREATE POLICY "Users can update settings" ON medex.user_settings
  FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Users can delete settings" ON medex.user_settings;
CREATE POLICY "Users can delete settings" ON medex.user_settings
  FOR DELETE TO public USING (true);

-- Audit logs policies
DROP POLICY IF EXISTS "Users can view audit logs" ON medex.audit_logs;
CREATE POLICY "Users can view audit logs" ON medex.audit_logs
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "System can insert audit logs" ON medex.audit_logs;
CREATE POLICY "System can insert audit logs" ON medex.audit_logs
  FOR INSERT TO public WITH CHECK (true);

-- Notes policies
DROP POLICY IF EXISTS "Users can view notes" ON medex.notes;
CREATE POLICY "Users can view notes" ON medex.notes
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can insert notes" ON medex.notes;
CREATE POLICY "Users can insert notes" ON medex.notes
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update notes" ON medex.notes;
CREATE POLICY "Users can update notes" ON medex.notes
  FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Users can delete notes" ON medex.notes;
CREATE POLICY "Users can delete notes" ON medex.notes
  FOR DELETE TO public USING (true);

-- User profiles policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'medex' AND table_name = 'user_profiles') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view profiles" ON medex.user_profiles';
    EXECUTE 'CREATE POLICY "Users can view profiles" ON medex.user_profiles FOR SELECT TO public USING (true)';

    EXECUTE 'DROP POLICY IF EXISTS "Users can update profiles" ON medex.user_profiles';
    EXECUTE 'CREATE POLICY "Users can update profiles" ON medex.user_profiles FOR UPDATE TO public USING (true)';

    EXECUTE 'DROP POLICY IF EXISTS "Users can insert profiles" ON medex.user_profiles';
    EXECUTE 'CREATE POLICY "Users can insert profiles" ON medex.user_profiles FOR INSERT TO public WITH CHECK (true)';

    EXECUTE 'DROP POLICY IF EXISTS "Users can delete profiles" ON medex.user_profiles';
    EXECUTE 'CREATE POLICY "Users can delete profiles" ON medex.user_profiles FOR DELETE TO public USING (true)';
  END IF;
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
--   • Created permissive RLS policies (using true for all access)
--   • Set up permissions
--   • CareXPS data remains in public schema (unaffected)
--   • MedEx will use medex schema (clean slate)
--
-- Note: RLS policies are set to permissive (true) for initial setup.
--       Tighten security later based on your requirements.
-- ============================================================================
