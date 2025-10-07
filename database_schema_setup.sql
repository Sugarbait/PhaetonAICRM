-- CareXPS Healthcare CRM Database Schema Setup
-- This script creates all necessary tables for the application
-- HIPAA compliant with proper encryption and audit capabilities

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  azure_ad_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'healthcare_provider', 'staff', 'super_user')),
  mfa_enabled BOOLEAN DEFAULT false,
  avatar_url TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create user_profiles table (missing table causing 400 errors)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create user_settings table (updated to match type definitions)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  notifications JSONB DEFAULT '{
    "email": true,
    "sms": true,
    "push": true,
    "in_app": true,
    "call_alerts": true,
    "sms_alerts": true,
    "security_alerts": true
  }'::jsonb,
  security_preferences JSONB DEFAULT '{
    "session_timeout": 900,
    "require_mfa": false,
    "password_expiry_reminder": true,
    "login_notifications": true
  }'::jsonb,
  communication_preferences JSONB DEFAULT '{
    "default_method": "phone",
    "auto_reply_enabled": false,
    "business_hours": {
      "enabled": false,
      "start": "09:00",
      "end": "17:00",
      "timezone": "UTC"
    }
  }'::jsonb,
  dashboard_layout JSONB DEFAULT NULL,
  accessibility_settings JSONB DEFAULT '{
    "high_contrast": false,
    "large_text": false,
    "screen_reader": false,
    "keyboard_navigation": false
  }'::jsonb,
  retell_config JSONB DEFAULT NULL,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,
  version INTEGER DEFAULT 1,
  device_sync_enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id)
);

-- Create audit_logs table (fixed to match code expectations)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT, -- Not a FK to allow for anonymous/system entries
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  phi_accessed BOOLEAN DEFAULT false,
  source_ip TEXT,
  user_agent TEXT,
  session_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE', 'WARNING')),
  failure_reason TEXT,
  additional_info JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'INFO' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INFO')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encrypted_first_name TEXT NOT NULL,
  encrypted_last_name TEXT NOT NULL,
  encrypted_phone TEXT,
  encrypted_email TEXT,
  preferences JSONB DEFAULT '{
    "communication_method": "phone",
    "timezone": "UTC"
  }'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_contact TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT true
);

-- Create calls table
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- in seconds
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  encrypted_transcription TEXT,
  encrypted_summary TEXT,
  sentiment JSONB,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  retell_ai_call_id TEXT,
  recording_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sms_messages table
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  encrypted_content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  thread_id TEXT NOT NULL,
  template_id UUID,
  contains_phi BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_id TEXT NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('call', 'sms')),
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'plain' CHECK (content_type IN ('plain', 'html', 'markdown')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  created_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT false,
  last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  last_edited_by_name TEXT,
  last_edited_at TIMESTAMPTZ,
  metadata JSONB
);

-- Create user_mfa_configs table
CREATE TABLE IF NOT EXISTS public.user_mfa_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_secret TEXT NOT NULL,
  encrypted_backup_codes JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  temporarily_disabled BOOLEAN DEFAULT false,
  registered_devices JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by_device_fingerprint TEXT,
  last_used_device_fingerprint TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id)
);

-- Create security_events table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  azure_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  device_info JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_azure_ad_id ON users(azure_ad_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_patient_id ON calls(patient_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_thread_id ON sms_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_notes_reference_id ON notes(reference_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mfa_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = azure_ad_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = azure_ad_id);

-- Create RLS policies for user_profiles table
CREATE POLICY "Users can access own profile" ON user_profiles
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE azure_ad_id = auth.uid()::text)
  );

-- Create RLS policies for user_settings table
CREATE POLICY "Users can access own settings" ON user_settings
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE azure_ad_id = auth.uid()::text)
  );

-- Create RLS policies for audit_logs table (admin/compliance officer access only)
CREATE POLICY "Audit logs admin access" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE azure_ad_id = auth.uid()::text
      AND role IN ('admin', 'super_user', 'compliance_officer')
    )
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for patients table
CREATE POLICY "Healthcare providers can access patients" ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE azure_ad_id = auth.uid()::text
      AND role IN ('admin', 'healthcare_provider', 'staff')
    )
  );

-- Create RLS policies for calls table
CREATE POLICY "Users can access own calls" ON calls
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE azure_ad_id = auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM users
      WHERE azure_ad_id = auth.uid()::text
      AND role IN ('admin', 'healthcare_provider')
    )
  );

-- Create RLS policies for sms_messages table
CREATE POLICY "Users can access relevant SMS messages" ON sms_messages
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE azure_ad_id = auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM users
      WHERE azure_ad_id = auth.uid()::text
      AND role IN ('admin', 'healthcare_provider')
    )
  );

-- Create RLS policies for notes table
CREATE POLICY "Users can access relevant notes" ON notes
  FOR ALL USING (
    created_by IN (SELECT id FROM users WHERE azure_ad_id = auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM users
      WHERE azure_ad_id = auth.uid()::text
      AND role IN ('admin', 'healthcare_provider')
    )
  );

-- Create RLS policies for user_mfa_configs table
CREATE POLICY "Users can access own MFA config" ON user_mfa_configs
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE azure_ad_id = auth.uid()::text)
  );

-- Create RLS policies for security_events table
CREATE POLICY "Users can view own security events" ON security_events
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE azure_ad_id = auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM users
      WHERE azure_ad_id = auth.uid()::text
      AND role IN ('admin', 'super_user')
    )
  );

CREATE POLICY "System can insert security events" ON security_events
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for user_sessions table
CREATE POLICY "Users can access own sessions" ON user_sessions
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE azure_ad_id = auth.uid()::text)
  );

-- Create functions for user role checking
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM users WHERE azure_ad_id = auth.uid()::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE azure_ad_id = auth.uid()::text
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_mfa_configs_updated_at BEFORE UPDATE ON user_mfa_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a test super user (for development/testing)
-- This will be removed in production
INSERT INTO users (azure_ad_id, email, name, role, is_active)
VALUES (
  'test-azure-id-123',
  'admin@carexps.local',
  'CareXPS Admin',
  'super_user',
  true
) ON CONFLICT (azure_ad_id) DO NOTHING;

-- Create corresponding user_profile and user_settings for test user
INSERT INTO user_profiles (user_id, display_name, timezone)
SELECT id, 'CareXPS Admin', 'UTC'
FROM users
WHERE azure_ad_id = 'test-azure-id-123'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_settings (user_id)
SELECT id
FROM users
WHERE azure_ad_id = 'test-azure-id-123'
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE users IS 'Core user accounts with Azure AD integration';
COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON TABLE user_settings IS 'User preferences and settings';
COMMENT ON TABLE audit_logs IS 'HIPAA compliant audit trail for all PHI access';
COMMENT ON TABLE patients IS 'Encrypted patient information (PHI)';
COMMENT ON TABLE calls IS 'Voice call records with encrypted transcripts';
COMMENT ON TABLE sms_messages IS 'SMS conversation history with encrypted content';
COMMENT ON TABLE notes IS 'Cross-device synchronized notes';
COMMENT ON TABLE user_mfa_configs IS 'Multi-factor authentication configurations';
COMMENT ON TABLE security_events IS 'Security event logging';
COMMENT ON TABLE user_sessions IS 'User session management';