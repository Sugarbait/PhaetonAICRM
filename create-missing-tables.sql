-- CareXPS CRM - Missing Tables Creation Script
-- Copy and paste this into your Supabase SQL Editor

-- 1. Create audit_logs table for HIPAA compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  phi_accessed BOOLEAN DEFAULT false,
  source_ip TEXT,
  user_agent TEXT,
  session_id TEXT,
  outcome TEXT NOT NULL,
  failure_reason TEXT,
  additional_info JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update notes table to match application schema
-- First check if notes table exists and drop if needed
DROP TABLE IF EXISTS public.notes CASCADE;

-- Create notes table with correct schema
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_id TEXT NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('call', 'sms')),
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'plain' CHECK (content_type IN ('plain', 'html', 'markdown')),
  created_by TEXT,
  created_by_name TEXT NOT NULL,
  created_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT false,
  last_edited_by TEXT,
  last_edited_by_name TEXT,
  last_edited_at TIMESTAMPTZ,
  metadata JSONB
);

-- 3. Create calls table
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID,
  user_id TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  encrypted_transcription TEXT,
  encrypted_summary TEXT,
  sentiment JSONB,
  tags TEXT[] DEFAULT '{}',
  retell_ai_call_id TEXT,
  recording_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create sms_messages table
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID,
  user_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  encrypted_content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  thread_id TEXT NOT NULL,
  template_id UUID,
  contains_phi BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encrypted_first_name TEXT NOT NULL,
  encrypted_last_name TEXT NOT NULL,
  encrypted_phone TEXT,
  encrypted_email TEXT,
  preferences JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  last_contact TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- 6. Update user_settings table to match schema
-- Check if user_settings needs to be recreated
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  notifications JSONB DEFAULT '{"email":true,"sms":true,"push":true,"in_app":true,"call_alerts":true,"sms_alerts":true,"security_alerts":true}',
  security_preferences JSONB DEFAULT '{"session_timeout":900,"require_mfa":true,"password_expiry_reminder":true,"login_notifications":true}',
  dashboard_layout JSONB,
  communication_preferences JSONB DEFAULT '{"default_method":"phone","auto_reply_enabled":false,"business_hours":{"enabled":false,"start":"09:00","end":"17:00","timezone":"UTC"}}',
  accessibility_settings JSONB DEFAULT '{"high_contrast":false,"large_text":false,"screen_reader":false,"keyboard_navigation":false}',
  retell_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  device_sync_enabled BOOLEAN DEFAULT true,
  last_synced TIMESTAMPTZ
);

-- 7. Create indexes for performance
-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_phi_accessed ON public.audit_logs(phi_accessed);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_reference_id ON public.notes(reference_id);
CREATE INDEX IF NOT EXISTS idx_notes_reference_type ON public.notes(reference_type);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON public.notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);

-- Calls indexes
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON public.calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_patient_id ON public.calls(patient_id);
CREATE INDEX IF NOT EXISTS idx_calls_start_time ON public.calls(start_time);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);

-- SMS indexes
CREATE INDEX IF NOT EXISTS idx_sms_user_id ON public.sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_patient_id ON public.sms_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_sms_thread_id ON public.sms_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_sms_timestamp ON public.sms_messages(timestamp);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_is_active ON public.patients(is_active);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies

-- Audit logs policies (allow all inserts, read own records)
CREATE POLICY "Allow audit log inserts" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid()::text = user_id);

-- Notes policies (users can CRUD their own notes)
CREATE POLICY "Users can view all notes" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Users can insert notes" ON public.notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their notes" ON public.notes FOR UPDATE USING (created_by = auth.uid()::text);
CREATE POLICY "Users can delete their notes" ON public.notes FOR DELETE USING (created_by = auth.uid()::text);

-- Calls policies
CREATE POLICY "Users can view their calls" ON public.calls FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert calls" ON public.calls FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update their calls" ON public.calls FOR UPDATE USING (user_id = auth.uid()::text);

-- SMS policies
CREATE POLICY "Users can view their SMS" ON public.sms_messages FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert SMS" ON public.sms_messages FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update their SMS" ON public.sms_messages FOR UPDATE USING (user_id = auth.uid()::text);

-- Patients policies
CREATE POLICY "Users can view patients they created" ON public.patients FOR SELECT USING (created_by = auth.uid()::text);
CREATE POLICY "Users can insert patients" ON public.patients FOR INSERT WITH CHECK (created_by = auth.uid()::text);
CREATE POLICY "Users can update patients they created" ON public.patients FOR UPDATE USING (created_by = auth.uid()::text);

-- User settings policies
CREATE POLICY "Users can view their settings" ON public.user_settings FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert their settings" ON public.user_settings FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can update their settings" ON public.user_settings FOR UPDATE USING (user_id = auth.uid()::text);

-- 10. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;

-- Also grant to anon for audit logs (needed for non-authenticated audit events)
GRANT SELECT, INSERT ON public.audit_logs TO anon;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_timestamp_notes BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_calls BEFORE UPDATE ON public.calls FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_patients BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp_user_settings BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();