-- Fix user ID conversion and missing view
-- This handles the TEXT to UUID conversion for existing users

-- Step 1: Fix user_settings table user_id type if needed
DO $$
BEGIN
  -- Check if user_settings.user_id is TEXT and convert to UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'user_id' AND data_type = 'text'
  ) THEN
    -- Create new user_settings table with UUID
    CREATE TABLE user_settings_new (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE NOT NULL,
      theme TEXT DEFAULT 'light',
      notifications JSONB DEFAULT '{\"calls\": true, \"sms\": true, \"system\": true}'::jsonb,
      session_timeout INTEGER DEFAULT 15,
      refresh_interval INTEGER DEFAULT 30000,
      retell_config JSONB,
      fresh_mfa_secret TEXT,
      fresh_mfa_enabled BOOLEAN DEFAULT false,
      fresh_mfa_setup_completed BOOLEAN DEFAULT false,
      fresh_mfa_backup_codes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Copy valid UUID data only
    INSERT INTO user_settings_new
    SELECT
      gen_random_uuid(),
      user_id::UUID,
      theme,
      notifications,
      session_timeout,
      refresh_interval,
      retell_config,
      fresh_mfa_secret,
      fresh_mfa_enabled,
      fresh_mfa_setup_completed,
      fresh_mfa_backup_codes,
      created_at,
      updated_at
    FROM user_settings
    WHERE user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ON CONFLICT DO NOTHING;

    -- Drop old table and rename
    DROP TABLE user_settings CASCADE;
    ALTER TABLE user_settings_new RENAME TO user_settings;

    -- Add foreign key constraint
    ALTER TABLE user_settings
    ADD CONSTRAINT user_settings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 2: Create the missing user_management_view with only existing columns
CREATE OR REPLACE VIEW user_management_view AS
SELECT
  u.*,
  us.fresh_mfa_enabled,
  us.fresh_mfa_setup_completed
FROM users u
LEFT JOIN user_settings us ON u.id::TEXT = us.user_id;

-- Grant permissions on the view
GRANT SELECT ON user_management_view TO authenticated;
GRANT SELECT ON user_management_view TO anon;

-- Step 2: Handle user ID conversion for Pierre specifically
-- Map the dynamic-pierre-user to Pierre's actual UUID
INSERT INTO users (id, email, name, role, is_super_user, is_active, is_enabled, profile_status)
VALUES
  ('c550502f-c39d-4bb3-bb8c-d193657fdb24'::UUID, 'pierre@phaetonai.com', 'Pierre', 'super_user', true, true, true, 'enabled')
ON CONFLICT (id)
DO UPDATE SET
  email = 'pierre@phaetonai.com',
  name = 'Pierre',
  role = 'super_user',
  is_super_user = true,
  is_active = true,
  is_enabled = true;

-- Step 3: Ensure ELM user exists with correct mapping
INSERT INTO users (id, email, name, role, is_super_user, is_active, is_enabled, profile_status)
VALUES
  ('ee77ed8f-525f-43c9-a70a-b81cb8dc8d5d'::UUID, 'elmfarrell@yahoo.com', 'ELM', 'super_user', true, true, true, 'enabled')
ON CONFLICT (id)
DO UPDATE SET
  email = 'elmfarrell@yahoo.com',
  name = 'ELM',
  role = 'super_user',
  is_super_user = true,
  is_active = true,
  is_enabled = true;

-- Step 4: Create company_settings table if missing
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on company_settings
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view company settings" ON company_settings;
DROP POLICY IF EXISTS "Only admins can update company settings" ON company_settings;

-- Create RLS policies for company_settings
CREATE POLICY "Anyone can view company settings" ON company_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update company settings" ON company_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (role = 'super_user' OR is_super_user = true)
    )
  );

-- Step 5: Add missing indexes
CREATE INDEX IF NOT EXISTS idx_user_management_view_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_company_settings_id ON company_settings(id);

-- Comments
COMMENT ON VIEW user_management_view IS 'Combined view of users and their settings for profile management';
COMMENT ON TABLE company_settings IS 'Company-wide settings including logos and branding';