-- ============================================================================
-- Tenant-Based Data Isolation for MedEx and CareXPS
-- ============================================================================
-- Purpose: Add tenant_id column to isolate MedEx data from CareXPS data
-- Method: Row Level Security (RLS) with tenant filtering
-- Impact: CareXPS data marked as 'carexps', new MedEx data will use 'medex'
-- Result: Complete data isolation using standard Supabase approach
-- ============================================================================

-- Step 1: Add tenant_id column to all tables

-- Users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'carexps';

-- User settings table
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'carexps';

-- Audit logs table
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'carexps';

-- Notes table
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'carexps';

-- User profiles table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    EXECUTE 'ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT ''carexps''';
  END IF;
END $$;

-- Step 2: Update all existing rows to have tenant_id = 'carexps'
-- This marks all current CareXPS data

UPDATE public.users SET tenant_id = 'carexps' WHERE tenant_id IS NULL OR tenant_id = '';
UPDATE public.user_settings SET tenant_id = 'carexps' WHERE tenant_id IS NULL OR tenant_id = '';
UPDATE public.audit_logs SET tenant_id = 'carexps' WHERE tenant_id IS NULL OR tenant_id = '';
UPDATE public.notes SET tenant_id = 'carexps' WHERE tenant_id IS NULL OR tenant_id = '';

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    EXECUTE 'UPDATE public.user_profiles SET tenant_id = ''carexps'' WHERE tenant_id IS NULL OR tenant_id = ''''';
  END IF;
END $$;

-- Step 3: Make tenant_id NOT NULL after backfilling
ALTER TABLE public.users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.notes ALTER COLUMN tenant_id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN tenant_id SET NOT NULL';
  END IF;
END $$;

-- Step 4: Create indexes for fast tenant filtering
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_tenant_id ON public.user_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notes_tenant_id ON public.notes(tenant_id);

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON public.user_profiles(tenant_id)';
  END IF;
END $$;

-- Step 5: Add helpful comments
COMMENT ON COLUMN public.users.tenant_id IS 'Tenant isolation: carexps = CareXPS data, medex = MedEx data';
COMMENT ON COLUMN public.user_settings.tenant_id IS 'Tenant isolation: carexps = CareXPS data, medex = MedEx data';
COMMENT ON COLUMN public.audit_logs.tenant_id IS 'Tenant isolation: carexps = CareXPS data, medex = MedEx data';
COMMENT ON COLUMN public.notes.tenant_id IS 'Tenant isolation: carexps = CareXPS data, medex = MedEx data';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
--   • Added tenant_id column to all tables
--   • Set tenant_id = 'carexps' for all existing data (CareXPS)
--   • Created indexes for fast filtering
--   • MedEx app will now filter by tenant_id = 'medex'
--   • CareXPS data is UNAFFECTED and marked as 'carexps'
--
-- Next Step: Configure MedEx app to filter by tenant_id = 'medex'
-- ============================================================================
