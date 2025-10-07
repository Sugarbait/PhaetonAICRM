-- Fix avatar upload and Super User role preservation
-- This migration addresses the UUID/TEXT mismatch and missing columns

-- Step 1: Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Step 2: Fix UUID/TEXT type mismatch for users.id
DO $$
BEGIN
  -- Check if users.id is TEXT and needs conversion to UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'text'
  ) THEN
    -- Drop foreign key constraints first
    ALTER TABLE IF EXISTS system_credentials DROP CONSTRAINT IF EXISTS system_credentials_user_id_fkey;
    ALTER TABLE IF EXISTS user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

    -- Create new users table with UUID
    CREATE TABLE users_new (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      is_super_user BOOLEAN DEFAULT false,
      is_enabled BOOLEAN DEFAULT true,
      profile_status TEXT DEFAULT 'enabled',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Copy existing data, only using columns that exist in old table
    INSERT INTO users_new (id, email, name, created_at, updated_at)
    SELECT
      CASE
        WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN id::UUID
        ELSE gen_random_uuid()
      END,
      email,
      COALESCE(name, ''),
      COALESCE(created_at, NOW()),
      COALESCE(updated_at, NOW())
    FROM users
    ON CONFLICT (id) DO NOTHING;

    -- Drop old table and rename
    DROP TABLE users CASCADE;
    ALTER TABLE users_new RENAME TO users;
  END IF;
END $$;

-- Step 3: Ensure system_credentials table has correct UUID type
CREATE TABLE IF NOT EXISTS system_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credential_type TEXT NOT NULL,
  api_key TEXT,
  call_agent_id TEXT,
  sms_agent_id TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, credential_type)
);

-- Step 4: Re-add foreign key constraints
ALTER TABLE system_credentials
ADD CONSTRAINT system_credentials_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 5: Insert demo users if they don't exist
INSERT INTO users (id, email, name, role, is_super_user, is_active, is_enabled, profile_status)
VALUES
  ('c550502f-c39d-4bb3-bb8c-d193657fdb24'::UUID, 'pierre@phaetonai.com', 'Pierre', 'super_user', true, true, true, 'enabled'),
  ('ee77ed8f-525f-43c9-a70a-b81cb8dc8d5d'::UUID, 'elmfarrell@yahoo.com', 'ELM', 'super_user', true, true, true, 'enabled')
ON CONFLICT (email)
DO UPDATE SET
  role = 'super_user',
  is_super_user = true,
  is_active = true,
  is_enabled = true;

-- Step 6: Enable RLS and create policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own avatar_url" ON users;
DROP POLICY IF EXISTS "Only admins can update user roles" ON users;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile except role" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (role = 'super_user' OR is_super_user = true)
    )
  );

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_system_credentials_user_id ON system_credentials(user_id);

-- Comments for documentation
COMMENT ON COLUMN users.avatar_url IS 'URL to user avatar stored in Supabase Storage';
COMMENT ON COLUMN users.role IS 'User role: user, admin, or super_user';