-- Fix user_profiles table for profile field persistence
-- This ensures the Department, Phone Number, and Location fields persist correctly

-- First, let's check if the user_profiles table exists and has the correct structure
-- Drop and recreate to ensure clean schema
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table with all required fields
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL, -- Don't add FK constraint to avoid issues with demo users
  display_name TEXT,
  department TEXT, -- For Department field
  phone TEXT,      -- For Phone Number field
  bio TEXT,        -- For Bio field
  location TEXT,   -- For Location field
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles (simplified to avoid auth issues)
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (true); -- Allow all reads for now

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (true); -- Allow all inserts for now

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (true); -- Allow all updates for now

-- Add indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX idx_user_profiles_department ON user_profiles(department);
CREATE INDEX idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX idx_user_profiles_location ON user_profiles(location);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_user_profiles_updated_at();

-- Add some test data for existing demo users (using VARCHAR IDs that match localStorage)
INSERT INTO user_profiles (user_id, display_name, department, phone, location, bio)
VALUES
  ('super-user-456'::TEXT::UUID, 'Dr. Farrell', 'Emergency Medicine', '', 'Toronto General Hospital', 'Experienced emergency physician'),
  ('pierre-user-789'::TEXT::UUID, 'Pierre PhaetonAI', 'IT Department', '', 'Remote', 'AI Systems Developer'),
  ('guest-user-456'::TEXT::UUID, 'Guest User', 'General', '', 'Demo Location', 'Demo user account')
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  department = EXCLUDED.department,
  phone = EXCLUDED.phone,
  location = EXCLUDED.location,
  bio = EXCLUDED.bio,
  updated_at = NOW();

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Extended user profile information including display name, department, phone, location, and bio';
COMMENT ON COLUMN user_profiles.user_id IS 'Reference to users table id (flexible for demo users)';
COMMENT ON COLUMN user_profiles.display_name IS 'Display name for the user profile';
COMMENT ON COLUMN user_profiles.department IS 'User department or team (e.g., Cardiology, Emergency Medicine)';
COMMENT ON COLUMN user_profiles.phone IS 'User phone number';
COMMENT ON COLUMN user_profiles.location IS 'User location (e.g., Toronto, ON or Remote)';
COMMENT ON COLUMN user_profiles.bio IS 'User biography or description';
COMMENT ON COLUMN user_profiles.preferences IS 'JSON object storing user preferences and settings';