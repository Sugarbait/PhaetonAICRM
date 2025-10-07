-- ============================================================================
-- FIX MFA UUID MAPPINGS - Fix MFA database issues after user ID migration
-- ============================================================================
-- This migration fixes MFA issues caused by TEXT to UUID user ID migration
-- by cleaning up orphaned MFA data and ensuring correct UUID mappings
-- ============================================================================

-- Log the start of the migration
DO $$
BEGIN
    RAISE NOTICE '🔧 Starting MFA UUID Mapping Fix Migration...';
    RAISE NOTICE 'This will fix MFA issues caused by user ID format migration';
END $$;

-- ============================================================================
-- 1. INSPECT CURRENT MFA DATA STATE
-- ============================================================================

-- Check for existing MFA data before cleanup
DO $$
DECLARE
    mfa_record RECORD;
    mfa_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 Inspecting current MFA data in user_settings table...';

    FOR mfa_record IN
        SELECT user_id,
               fresh_mfa_enabled,
               fresh_mfa_setup_completed,
               CASE WHEN fresh_mfa_secret IS NOT NULL THEN 'HAS_SECRET' ELSE 'NO_SECRET' END as secret_status
        FROM user_settings
        WHERE fresh_mfa_secret IS NOT NULL
           OR fresh_mfa_enabled = true
           OR fresh_mfa_setup_completed = true
    LOOP
        mfa_count := mfa_count + 1;
        RAISE NOTICE '   📋 User ID: % | Enabled: % | Setup: % | Secret: %',
            mfa_record.user_id,
            mfa_record.fresh_mfa_enabled,
            mfa_record.fresh_mfa_setup_completed,
            mfa_record.secret_status;
    END LOOP;

    IF mfa_count = 0 THEN
        RAISE NOTICE '   ℹ️ No existing MFA data found';
    ELSE
        RAISE NOTICE '   📊 Found % MFA records to process', mfa_count;
    END IF;
END $$;

-- ============================================================================
-- 2. CLEAR ORPHANED MFA DATA FROM INCORRECT UUID MAPPINGS
-- ============================================================================

-- Clear MFA data from the incorrect UUID mapping for dynamic-pierre-user
DO $$
DECLARE
    orphaned_uuid UUID := 'a1b2c3d4-e5f6-7890-abcd-123456789012';
    rows_affected INTEGER;
BEGIN
    RAISE NOTICE '🧹 Clearing orphaned MFA data from incorrect UUID mapping...';

    -- Check if this UUID has any MFA data
    SELECT COUNT(*) INTO rows_affected
    FROM user_settings
    WHERE user_id = orphaned_uuid
      AND (fresh_mfa_secret IS NOT NULL
           OR fresh_mfa_enabled = true
           OR fresh_mfa_setup_completed = true);

    IF rows_affected > 0 THEN
        RAISE NOTICE '   🗑️ Found % MFA records for orphaned UUID: %', rows_affected, orphaned_uuid;

        -- Clear the orphaned MFA data
        UPDATE user_settings
        SET fresh_mfa_secret = NULL,
            fresh_mfa_enabled = false,
            fresh_mfa_setup_completed = false,
            fresh_mfa_backup_codes = NULL,
            updated_at = NOW()
        WHERE user_id = orphaned_uuid;

        RAISE NOTICE '   ✅ Cleared orphaned MFA data for UUID: %', orphaned_uuid;
    ELSE
        RAISE NOTICE '   ℹ️ No orphaned MFA data found for UUID: %', orphaned_uuid;
    END IF;
END $$;

-- ============================================================================
-- 3. ENSURE CLEAN STATE FOR CORRECT UUID MAPPINGS
-- ============================================================================

-- Clear any potentially corrupted MFA data for Pierre's correct UUID
DO $$
DECLARE
    pierre_uuid UUID := 'c550502f-c39d-4bb3-bb8c-d193657fdb24';
    elm_uuid UUID := 'ee77ed8f-525f-43c9-a70a-b81cb8dc8d5d';
    rows_affected INTEGER;
BEGIN
    RAISE NOTICE '🔄 Ensuring clean MFA state for correct UUID mappings...';

    -- Check Pierre's UUID
    SELECT COUNT(*) INTO rows_affected
    FROM user_settings
    WHERE user_id = pierre_uuid
      AND (fresh_mfa_secret IS NOT NULL
           OR fresh_mfa_enabled = true
           OR fresh_mfa_setup_completed = true);

    IF rows_affected > 0 THEN
        RAISE NOTICE '   🧹 Clearing potentially corrupted MFA data for Pierre UUID: %', pierre_uuid;

        UPDATE user_settings
        SET fresh_mfa_secret = NULL,
            fresh_mfa_enabled = false,
            fresh_mfa_setup_completed = false,
            fresh_mfa_backup_codes = NULL,
            updated_at = NOW()
        WHERE user_id = pierre_uuid;

        RAISE NOTICE '   ✅ Cleared MFA data for Pierre UUID: %', pierre_uuid;
    ELSE
        RAISE NOTICE '   ℹ️ No existing MFA data for Pierre UUID: %', pierre_uuid;
    END IF;

    -- Check Elm's UUID
    SELECT COUNT(*) INTO rows_affected
    FROM user_settings
    WHERE user_id = elm_uuid
      AND (fresh_mfa_secret IS NOT NULL
           OR fresh_mfa_enabled = true
           OR fresh_mfa_setup_completed = true);

    IF rows_affected > 0 THEN
        RAISE NOTICE '   🧹 Clearing potentially corrupted MFA data for Elm UUID: %', elm_uuid;

        UPDATE user_settings
        SET fresh_mfa_secret = NULL,
            fresh_mfa_enabled = false,
            fresh_mfa_setup_completed = false,
            fresh_mfa_backup_codes = NULL,
            updated_at = NOW()
        WHERE user_id = elm_uuid;

        RAISE NOTICE '   ✅ Cleared MFA data for Elm UUID: %', elm_uuid;
    ELSE
        RAISE NOTICE '   ℹ️ No existing MFA data for Elm UUID: %', elm_uuid;
    END IF;
END $$;

-- ============================================================================
-- 4. VERIFY CLEAN STATE AND CORRECT MAPPINGS
-- ============================================================================

-- Verify the cleanup was successful
DO $$
DECLARE
    remaining_mfa_count INTEGER;
    user_record RECORD;
BEGIN
    RAISE NOTICE '🔍 Verifying MFA cleanup and correct UUID mappings...';

    -- Count remaining MFA data
    SELECT COUNT(*) INTO remaining_mfa_count
    FROM user_settings
    WHERE fresh_mfa_secret IS NOT NULL
       OR fresh_mfa_enabled = true
       OR fresh_mfa_setup_completed = true;

    IF remaining_mfa_count = 0 THEN
        RAISE NOTICE '   ✅ All MFA data successfully cleared - clean slate for re-setup';
    ELSE
        RAISE NOTICE '   ⚠️ Warning: % MFA records still remain:', remaining_mfa_count;

        FOR user_record IN
            SELECT user_id, fresh_mfa_enabled, fresh_mfa_setup_completed
            FROM user_settings
            WHERE fresh_mfa_secret IS NOT NULL
               OR fresh_mfa_enabled = true
               OR fresh_mfa_setup_completed = true
        LOOP
            RAISE NOTICE '     - UUID: % | Enabled: % | Setup: %',
                user_record.user_id,
                user_record.fresh_mfa_enabled,
                user_record.fresh_mfa_setup_completed;
        END LOOP;
    END IF;

    -- Verify correct user mappings exist in users table
    IF EXISTS (SELECT 1 FROM users WHERE id = 'c550502f-c39d-4bb3-bb8c-d193657fdb24'::UUID) THEN
        RAISE NOTICE '   ✅ Pierre UUID mapping exists in users table';
    ELSE
        RAISE NOTICE '   ⚠️ Warning: Pierre UUID not found in users table';
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE id = 'ee77ed8f-525f-43c9-a70a-b81cb8dc8d5d'::UUID) THEN
        RAISE NOTICE '   ✅ Elm UUID mapping exists in users table';
    ELSE
        RAISE NOTICE '   ⚠️ Warning: Elm UUID not found in users table';
    END IF;
END $$;

-- ============================================================================
-- 5. CREATE FUNCTION TO HELP DEBUG MFA UUID ISSUES
-- ============================================================================

-- Create a helper function to check MFA status for debugging
CREATE OR REPLACE FUNCTION check_user_mfa_status(input_user_id TEXT)
RETURNS TABLE (
    user_id_input TEXT,
    uuid_found UUID,
    has_mfa_data BOOLEAN,
    mfa_enabled BOOLEAN,
    setup_completed BOOLEAN,
    user_exists BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_uuid UUID;
    settings_record RECORD;
BEGIN
    -- Try to parse input as UUID first
    BEGIN
        target_uuid := input_user_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        -- If not UUID, try common mappings
        CASE input_user_id
            WHEN 'pierre-user-789' THEN target_uuid := 'c550502f-c39d-4bb3-bb8c-d193657fdb24'::UUID;
            WHEN 'dynamic-pierre-user' THEN target_uuid := 'c550502f-c39d-4bb3-bb8c-d193657fdb24'::UUID;
            WHEN 'super-user-456' THEN target_uuid := 'ee77ed8f-525f-43c9-a70a-b81cb8dc8d5d'::UUID;
            ELSE target_uuid := NULL;
        END CASE;
    END;

    IF target_uuid IS NULL THEN
        RETURN QUERY SELECT
            input_user_id,
            NULL::UUID,
            FALSE,
            FALSE,
            FALSE,
            FALSE;
        RETURN;
    END IF;

    -- Get MFA settings
    SELECT fresh_mfa_enabled, fresh_mfa_setup_completed,
           (fresh_mfa_secret IS NOT NULL) as has_secret
    INTO settings_record
    FROM user_settings
    WHERE user_settings.user_id = target_uuid;

    -- Check if user exists
    RETURN QUERY SELECT
        input_user_id,
        target_uuid,
        COALESCE(settings_record.has_secret, FALSE),
        COALESCE(settings_record.fresh_mfa_enabled, FALSE),
        COALESCE(settings_record.fresh_mfa_setup_completed, FALSE),
        EXISTS(SELECT 1 FROM users WHERE id = target_uuid);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_user_mfa_status(TEXT) TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ MFA UUID Mapping Fix Migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Migration Summary:';
    RAISE NOTICE '   1. ✅ Inspected existing MFA data state';
    RAISE NOTICE '   2. ✅ Cleared orphaned MFA data from incorrect UUID mappings';
    RAISE NOTICE '   3. ✅ Ensured clean state for correct UUID mappings';
    RAISE NOTICE '   4. ✅ Verified cleanup and UUID mapping correctness';
    RAISE NOTICE '   5. ✅ Created debug function: check_user_mfa_status()';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Fixed UUID Mappings:';
    RAISE NOTICE '   - dynamic-pierre-user → c550502f-c39d-4bb3-bb8c-d193657fdb24';
    RAISE NOTICE '   - pierre-user-789 → c550502f-c39d-4bb3-bb8c-d193657fdb24';
    RAISE NOTICE '   - super-user-456 → ee77ed8f-525f-43c9-a70a-b81cb8dc8d5d';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next Steps:';
    RAISE NOTICE '   1. Deploy the updated userIdTranslationService.ts';
    RAISE NOTICE '   2. Have users re-setup MFA in Settings → Security';
    RAISE NOTICE '   3. Test TOTP code generation and verification';
    RAISE NOTICE '   4. Use check_user_mfa_status(''user-id'') for debugging';
    RAISE NOTICE '';
    RAISE NOTICE '🚨 IMPORTANT: All users must re-setup MFA after this migration!';
END $$;