-- Create user_profiles table for extended profile information
-- This table stores additional profile data beyond the core users table

-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  display_name TEXT,
  department TEXT,
  phone TEXT,
  bio TEXT,
  location TEXT,
  timezone TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles (simplified, no foreign key dependencies)
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (user_id::TEXT = auth.uid()::TEXT);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR ALL USING (user_id::TEXT = auth.uid()::TEXT);

-- Add indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX idx_user_profiles_department ON user_profiles(department);

-- Insert a default profile for Pierre (hardcoded UUID from migration)
INSERT INTO user_profiles (user_id, display_name, department, phone)
VALUES
  ('c550502f-c39d-4bb3-bb8c-d193657fdb24'::UUID, 'Pierre', 'IT Department', ''),
  ('ee77ed8f-525f-43c9-a70a-b81cb8dc8d5d'::UUID, 'ELM', 'IT Department', '')
ON CONFLICT (user_id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Extended user profile information including display name, department, and preferences';
COMMENT ON COLUMN user_profiles.user_id IS 'Reference to users table id';
COMMENT ON COLUMN user_profiles.display_name IS 'Display name for the user profile';
COMMENT ON COLUMN user_profiles.department IS 'User department or team';
COMMENT ON COLUMN user_profiles.preferences IS 'JSON object storing user preferences and settings';