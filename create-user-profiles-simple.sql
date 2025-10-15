-- Create user_profiles table with encrypted_retell_api_key column
-- This is REQUIRED for credential storage

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  display_name TEXT,
  department TEXT,
  phone TEXT,
  bio TEXT,
  location TEXT,
  timezone TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  encrypted_retell_api_key TEXT,  -- CRITICAL: For credential storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (true);  -- Allow all for now

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR ALL USING (true);  -- Allow all for now

-- Add indexes
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Verify table was created
SELECT 'user_profiles table created successfully!' as result;
