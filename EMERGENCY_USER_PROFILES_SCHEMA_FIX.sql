-- ============================================================================
-- EMERGENCY USER PROFILES SCHEMA FIX
-- ============================================================================
-- Purpose: Add missing encrypted_agent_config column to user_profiles table
-- Issue: API key storage failing due to missing column
-- Date: 2025-09-24
-- ============================================================================

-- Step 1: Check current schema and add missing column safely
DO $$
BEGIN
    -- Add encrypted_agent_config column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'encrypted_agent_config'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN encrypted_agent_config JSONB DEFAULT NULL;

        RAISE NOTICE '✅ Added encrypted_agent_config column to user_profiles table';
    ELSE
        RAISE NOTICE '⚠️  encrypted_agent_config column already exists in user_profiles table';
    END IF;

    -- Add encrypted_retell_api_key column if it doesn't exist (safety check)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'encrypted_retell_api_key'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN encrypted_retell_api_key TEXT DEFAULT NULL;

        RAISE NOTICE '✅ Added encrypted_retell_api_key column to user_profiles table';
    ELSE
        RAISE NOTICE '⚠️  encrypted_retell_api_key column already exists in user_profiles table';
    END IF;
END $$;

-- Step 2: Create index for performance on encrypted columns (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_profiles_encrypted_retell_api_key
ON public.user_profiles (encrypted_retell_api_key)
WHERE encrypted_retell_api_key IS NOT NULL;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN public.user_profiles.encrypted_agent_config IS 'Encrypted JSON configuration for Retell AI agent settings';
COMMENT ON COLUMN public.user_profiles.encrypted_retell_api_key IS 'Encrypted Retell AI API key for user authentication';

-- Step 4: Verify the changes
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND table_schema = 'public'
    AND column_name IN ('encrypted_agent_config', 'encrypted_retell_api_key');

    IF col_count = 2 THEN
        RAISE NOTICE '✅ SCHEMA FIX SUCCESSFUL: Both encrypted columns are now present in user_profiles table';
    ELSE
        RAISE NOTICE '❌ SCHEMA FIX FAILED: Only % of 2 required columns found', col_count;
    END IF;
END $$;

-- Step 5: Test the table structure with a sample query (without inserting data)
DO $$
BEGIN
    -- This will fail if the columns don't exist properly
    PERFORM
        id, user_id, encrypted_retell_api_key, encrypted_agent_config,
        created_at, updated_at
    FROM public.user_profiles
    WHERE FALSE; -- Don't return any rows, just test structure

    RAISE NOTICE '✅ TABLE STRUCTURE TEST PASSED: All required columns accessible';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ TABLE STRUCTURE TEST FAILED: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to confirm the fix)
-- ============================================================================

-- Check column existence
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND table_schema = 'public'
AND column_name IN ('encrypted_retell_api_key', 'encrypted_agent_config')
ORDER BY column_name;

-- Check table structure
\d public.user_profiles;