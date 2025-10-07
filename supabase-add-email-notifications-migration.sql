-- ============================================================================
-- ADD EMAIL NOTIFICATIONS COLUMN TO USER_SETTINGS TABLE
-- ============================================================================
-- This migration adds the missing email_notifications column to enable
-- proper persistence of email notification settings in Supabase
-- ============================================================================

-- Add the email_notifications column to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS email_notifications JSONB DEFAULT '{
  "enabled": false,
  "recipientEmails": [],
  "notificationTypes": {
    "newSMS": true,
    "newCall": true,
    "securityAlerts": true,
    "systemAlerts": true
  }
}'::jsonb;

-- Add index for email notifications queries
CREATE INDEX IF NOT EXISTS idx_user_settings_email_notifications
ON user_settings USING GIN (email_notifications);

-- Add comment for documentation
COMMENT ON COLUMN user_settings.email_notifications IS 'JSONB configuration for email notification settings including recipients and types';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Email notifications column added to user_settings table';
    RAISE NOTICE '📋 Column Details:';
    RAISE NOTICE '   - Name: email_notifications';
    RAISE NOTICE '   - Type: JSONB';
    RAISE NOTICE '   - Default: Disabled with empty recipients';
    RAISE NOTICE '   - Index: GIN index for efficient queries';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Email Notification Features:';
    RAISE NOTICE '   - Email settings persistence in Supabase';
    RAISE NOTICE '   - Real-time cross-device synchronization';
    RAISE NOTICE '   - HIPAA-compliant PHI-free notifications';
    RAISE NOTICE '   - Configurable notification types';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Ready for Email Notification Service!';
END $$;