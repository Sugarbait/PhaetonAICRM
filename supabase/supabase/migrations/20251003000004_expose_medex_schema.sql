-- ============================================================================
-- Expose MedEx Schema to PostgREST API
-- ============================================================================
-- Purpose: Make the medex schema accessible via Supabase REST API
-- Issue: PostgREST only exposes schemas listed in its configuration
-- Solution: Add medex to the exposed schemas list
-- ============================================================================

-- Note: This SQL adds medex to exposed schemas, but you also need to update
-- the PostgREST configuration in Supabase dashboard

-- Grant API access to medex schema
GRANT USAGE ON SCHEMA medex TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA medex TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA medex TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA medex TO anon, authenticated, service_role, postgres;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA medex GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA medex GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA medex GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role, postgres;

-- ============================================================================
-- IMPORTANT: PostgREST Configuration Required
-- ============================================================================
--
-- After running this SQL, you MUST update PostgREST configuration:
--
-- 1. Go to: Supabase Dashboard → Settings → API
-- 2. Look for: "Exposed schemas" or "db-schema" setting
-- 3. Add: medex to the list (comma-separated)
--    Example: public, medex
--
-- OR via SQL (if you have access to postgres role):
--
-- ALTER DATABASE postgres SET pgrst.db_schemas = 'public, medex';
--
-- Then restart PostgREST service (automatic in Supabase cloud)
-- ============================================================================

COMMENT ON SCHEMA medex IS 'MedEx Healthcare CRM - Exposed to PostgREST API for REST access';
