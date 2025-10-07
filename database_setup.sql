-- CareXPS Healthcare CRM Database Setup
-- This script creates all missing tables with proper HIPAA compliance and security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS for all tables
SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = on;

-- ============================================================================
-- ENUMS (Create first as they're referenced by tables)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'healthcare_provider', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_status AS ENUM ('active', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sms_direction AS ENUM ('inbound', 'outbound');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sms_status AS ENUM ('sent', 'delivered', 'read', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE communication_method AS ENUM ('phone', 'sms', 'email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE security_event_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'auto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('email', 'sms', 'push', 'in_app');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. USERS TABLE (Primary user management)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    azure_ad_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    avatar_url TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_azure_ad_id ON users(azure_ad_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- 2. USER_PROFILES TABLE (Extended user profile data - Referenced by services)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_retell_api_key TEXT, -- Used for storing encrypted credentials
    avatar_data BYTEA, -- Binary avatar data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 3. USER_PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource TEXT NOT NULL,
    actions TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON user_permissions(resource);

-- 4. USER_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme theme_preference NOT NULL DEFAULT 'auto',
    notifications JSONB NOT NULL DEFAULT '{
        "email": true,
        "sms": true,
        "push": true,
        "in_app": true,
        "call_alerts": true,
        "sms_alerts": true,
        "security_alerts": true
    }'::jsonb,
    security_preferences JSONB NOT NULL DEFAULT '{
        "session_timeout": 900,
        "require_mfa": false,
        "password_expiry_reminder": true,
        "login_notifications": true
    }'::jsonb,
    dashboard_layout JSONB,
    communication_preferences JSONB NOT NULL DEFAULT '{
        "default_method": "phone",
        "auto_reply_enabled": false,
        "business_hours": {
            "enabled": false,
            "start": "09:00",
            "end": "17:00",
            "timezone": "America/New_York"
        }
    }'::jsonb,
    accessibility_settings JSONB NOT NULL DEFAULT '{
        "high_contrast": false,
        "large_text": false,
        "screen_reader": false,
        "keyboard_navigation": false
    }'::jsonb,
    retell_config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_sync_enabled BOOLEAN NOT NULL DEFAULT true,
    last_synced TIMESTAMPTZ,
    UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================================
-- SECURITY & AUDIT TABLES (HIPAA Compliance)
-- ============================================================================

-- 5. AUDIT_LOGS TABLE (HIPAA-compliant audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Add indexes for performance and compliance queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);

-- 6. SECURITY_EVENTS TABLE
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity security_event_severity NOT NULL DEFAULT 'low',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for security monitoring
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_action ON security_events(action);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_success ON security_events(success);

-- 7. FAILED_LOGIN_ATTEMPTS TABLE (Security tracking)
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    reason TEXT
);

-- Add indexes for security queries
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at ON failed_login_attempts(attempted_at);

-- ============================================================================
-- PATIENT & HEALTHCARE DATA TABLES
-- ============================================================================

-- 8. PATIENTS TABLE (Encrypted PHI data)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encrypted_first_name TEXT NOT NULL,
    encrypted_last_name TEXT NOT NULL,
    encrypted_phone TEXT,
    encrypted_email TEXT,
    preferences JSONB NOT NULL DEFAULT '{
        "communication_method": "phone",
        "timezone": "America/New_York"
    }'::jsonb,
    tags TEXT[] NOT NULL DEFAULT '{}',
    last_contact TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_last_contact ON patients(last_contact);
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active);

-- ============================================================================
-- COMMUNICATION TABLES
-- ============================================================================

-- 9. CALLS TABLE
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    user_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER, -- Duration in seconds
    status call_status NOT NULL DEFAULT 'active',
    encrypted_transcription TEXT,
    encrypted_summary TEXT,
    sentiment JSONB,
    tags TEXT[] NOT NULL DEFAULT '{}',
    retell_ai_call_id TEXT,
    recording_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_calls_patient_id ON calls(patient_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_start_time ON calls(start_time);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_retell_ai_call_id ON calls(retell_ai_call_id);

-- 10. SMS_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS sms_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    user_id UUID REFERENCES users(id),
    direction sms_direction NOT NULL,
    encrypted_content TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status sms_status NOT NULL DEFAULT 'sent',
    thread_id TEXT NOT NULL,
    template_id UUID,
    contains_phi BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_messages_patient_id ON sms_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_thread_id ON sms_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_timestamp ON sms_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_sms_messages_direction ON sms_messages(direction);

-- 11. SMS_TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    variables TEXT[] NOT NULL DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON sms_templates(category);
CREATE INDEX IF NOT EXISTS idx_sms_templates_created_by ON sms_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON sms_templates(is_active);

-- ============================================================================
-- SESSION & MFA TABLES
-- ============================================================================

-- 12. USER_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    azure_session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_info JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- 13. MFA_CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS mfa_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_code TEXT NOT NULL,
    method TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user_id ON mfa_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expires_at ON mfa_challenges(expires_at);

-- 14. USER_MFA_CONFIGS TABLE
CREATE TABLE IF NOT EXISTS user_mfa_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_secret TEXT NOT NULL,
    encrypted_backup_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    temporarily_disabled BOOLEAN NOT NULL DEFAULT false,
    registered_devices JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    disabled_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_by_device_fingerprint TEXT,
    last_used_device_fingerprint TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mfa_configs_user_id ON user_mfa_configs(user_id);

-- ============================================================================
-- NOTES & COMPLIANCE TABLES
-- ============================================================================

-- 15. CALL_NOTES TABLE
CREATE TABLE IF NOT EXISTS call_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    encrypted_content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_notes_call_id ON call_notes(call_id);
CREATE INDEX IF NOT EXISTS idx_call_notes_user_id ON call_notes(user_id);

-- 16. NOTES TABLE (General notes system)
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id TEXT NOT NULL,
    reference_type TEXT NOT NULL CHECK (reference_type IN ('call', 'sms')),
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'plain' CHECK (content_type IN ('plain', 'html', 'markdown')),
    created_by UUID REFERENCES users(id),
    created_by_name TEXT NOT NULL,
    created_by_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_edited BOOLEAN NOT NULL DEFAULT false,
    last_edited_by UUID REFERENCES users(id),
    last_edited_by_name TEXT,
    last_edited_at TIMESTAMPTZ,
    metadata JSONB
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_reference_id ON notes(reference_id);
CREATE INDEX IF NOT EXISTS idx_notes_reference_type ON notes(reference_type);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);

-- 17. DATA_RETENTION_POLICIES TABLE
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL,
    auto_delete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. COMPLIANCE_ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS compliance_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_retention_compliance DECIMAL(5,2) NOT NULL,
    mfa_adoption DECIMAL(5,2) NOT NULL,
    encryption_coverage DECIMAL(5,2) NOT NULL,
    audit_log_completeness DECIMAL(5,2) NOT NULL,
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID NOT NULL REFERENCES users(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_date ON compliance_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_created_by ON compliance_assessments(created_by);

-- ============================================================================
-- UPDATED_AT TRIGGERS (Automatically update timestamps)
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for tables that have updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_templates_updated_at ON sms_templates;
CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_call_notes_updated_at ON call_notes;
CREATE TRIGGER update_call_notes_updated_at BEFORE UPDATE ON call_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_mfa_configs_updated_at ON user_mfa_configs;
CREATE TRIGGER update_user_mfa_configs_updated_at BEFORE UPDATE ON user_mfa_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_retention_policies_updated_at ON data_retention_policies;
CREATE TRIGGER update_data_retention_policies_updated_at BEFORE UPDATE ON data_retention_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mfa_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_assessments ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from JWT
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = get_current_user_id()
        AND role = required_role
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(resource_name TEXT, action_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admins have all permissions
    IF user_has_role('admin') THEN
        RETURN true;
    END IF;

    -- Check specific permissions
    RETURN EXISTS (
        SELECT 1 FROM user_permissions up
        JOIN users u ON u.id = up.user_id
        WHERE u.id = get_current_user_id()
        AND u.is_active = true
        AND up.resource = resource_name
        AND action_name = ANY(up.actions)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES FOR EACH TABLE
-- ============================================================================

-- USERS table policies
DROP POLICY IF EXISTS "Users can view their own record" ON users;
CREATE POLICY "Users can view their own record" ON users
    FOR SELECT USING (id = get_current_user_id());

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (user_has_role('admin'));

DROP POLICY IF EXISTS "Users can update their own record" ON users;
CREATE POLICY "Users can update their own record" ON users
    FOR UPDATE USING (id = get_current_user_id());

DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (user_has_role('admin'));

DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (user_has_role('admin'));

DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (user_has_role('admin'));

-- USER_PROFILES table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (user_has_role('admin'));

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (user_has_role('admin'));

-- USER_SETTINGS table policies
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Admins can view all settings" ON user_settings;
CREATE POLICY "Admins can view all settings" ON user_settings
    FOR SELECT USING (user_has_role('admin'));

-- AUDIT_LOGS table policies (Read-only for compliance)
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (user_has_role('admin'));

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true); -- Allow system to log

-- SECURITY_EVENTS table policies
DROP POLICY IF EXISTS "Admins can view security events" ON security_events;
CREATE POLICY "Admins can view security events" ON security_events
    FOR SELECT USING (user_has_role('admin'));

DROP POLICY IF EXISTS "System can insert security events" ON security_events;
CREATE POLICY "System can insert security events" ON security_events
    FOR INSERT WITH CHECK (true); -- Allow system to log

-- FAILED_LOGIN_ATTEMPTS table policies
DROP POLICY IF EXISTS "Admins can view failed login attempts" ON failed_login_attempts;
CREATE POLICY "Admins can view failed login attempts" ON failed_login_attempts
    FOR SELECT USING (user_has_role('admin'));

DROP POLICY IF EXISTS "System can insert failed login attempts" ON failed_login_attempts;
CREATE POLICY "System can insert failed login attempts" ON failed_login_attempts
    FOR INSERT WITH CHECK (true); -- Allow system to log

DROP POLICY IF EXISTS "System can delete old failed login attempts" ON failed_login_attempts;
CREATE POLICY "System can delete old failed login attempts" ON failed_login_attempts
    FOR DELETE USING (true); -- Allow cleanup

-- PATIENTS table policies (Healthcare data - strict access control)
DROP POLICY IF EXISTS "Healthcare providers can view patients" ON patients;
CREATE POLICY "Healthcare providers can view patients" ON patients
    FOR SELECT USING (
        user_has_role('admin') OR
        user_has_role('healthcare_provider') OR
        user_has_permission('patients', 'read')
    );

DROP POLICY IF EXISTS "Healthcare providers can create patients" ON patients;
CREATE POLICY "Healthcare providers can create patients" ON patients
    FOR INSERT WITH CHECK (
        user_has_role('admin') OR
        user_has_role('healthcare_provider') OR
        user_has_permission('patients', 'write')
    );

DROP POLICY IF EXISTS "Healthcare providers can update patients" ON patients;
CREATE POLICY "Healthcare providers can update patients" ON patients
    FOR UPDATE USING (
        user_has_role('admin') OR
        user_has_role('healthcare_provider') OR
        user_has_permission('patients', 'write')
    );

-- CALLS table policies
DROP POLICY IF EXISTS "Users can view their own calls" ON calls;
CREATE POLICY "Users can view their own calls" ON calls
    FOR SELECT USING (
        user_id = get_current_user_id() OR
        user_has_role('admin') OR
        user_has_permission('calls', 'read')
    );

DROP POLICY IF EXISTS "Users can insert calls" ON calls;
CREATE POLICY "Users can insert calls" ON calls
    FOR INSERT WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can update their own calls" ON calls;
CREATE POLICY "Users can update their own calls" ON calls
    FOR UPDATE USING (
        user_id = get_current_user_id() OR
        user_has_role('admin') OR
        user_has_permission('calls', 'write')
    );

-- SMS_MESSAGES table policies
DROP POLICY IF EXISTS "Users can view accessible SMS messages" ON sms_messages;
CREATE POLICY "Users can view accessible SMS messages" ON sms_messages
    FOR SELECT USING (
        user_id = get_current_user_id() OR
        user_has_role('admin') OR
        user_has_permission('sms_messages', 'read')
    );

DROP POLICY IF EXISTS "Users can insert SMS messages" ON sms_messages;
CREATE POLICY "Users can insert SMS messages" ON sms_messages
    FOR INSERT WITH CHECK (
        user_id = get_current_user_id() OR
        user_has_permission('sms_messages', 'write')
    );

-- NOTES table policies
DROP POLICY IF EXISTS "Users can view notes" ON notes;
CREATE POLICY "Users can view notes" ON notes
    FOR SELECT USING (
        created_by = get_current_user_id() OR
        user_has_role('admin') OR
        user_has_permission('notes', 'read')
    );

DROP POLICY IF EXISTS "Users can create notes" ON notes;
CREATE POLICY "Users can create notes" ON notes
    FOR INSERT WITH CHECK (
        created_by = get_current_user_id() OR
        user_has_permission('notes', 'write')
    );

DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE USING (
        created_by = get_current_user_id() OR
        user_has_role('admin') OR
        user_has_permission('notes', 'write')
    );

-- USER_SESSIONS table policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can manage their own sessions" ON user_sessions;
CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Admins can view all sessions" ON user_sessions;
CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR SELECT USING (user_has_role('admin'));

-- MFA related table policies
DROP POLICY IF EXISTS "Users can manage their own MFA" ON mfa_challenges;
CREATE POLICY "Users can manage their own MFA" ON mfa_challenges
    FOR ALL USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "Users can manage their own MFA config" ON user_mfa_configs;
CREATE POLICY "Users can manage their own MFA config" ON user_mfa_configs
    FOR ALL USING (user_id = get_current_user_id());

-- ============================================================================
-- INITIAL DATA & CLEANUP FUNCTION
-- ============================================================================

-- Cleanup function for expired data (HIPAA compliance)
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired MFA challenges
    DELETE FROM mfa_challenges WHERE expires_at < NOW();

    -- Clean up expired sessions
    DELETE FROM user_sessions WHERE expires_at < NOW();

    -- Clean up old failed login attempts (keep last 30 days)
    DELETE FROM failed_login_attempts WHERE attempted_at < NOW() - INTERVAL '30 days';

    -- Log cleanup action
    INSERT INTO audit_logs (action, table_name, metadata)
    VALUES ('CLEANUP_EXPIRED_DATA', 'system',
            jsonb_build_object('timestamp', NOW(), 'action', 'automated_cleanup'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default data retention policies (HIPAA compliant)
INSERT INTO data_retention_policies (table_name, retention_days, auto_delete) VALUES
('audit_logs', 2555, false), -- 7 years for HIPAA
('security_events', 2555, false), -- 7 years for HIPAA
('failed_login_attempts', 30, true), -- 30 days
('mfa_challenges', 1, true), -- 1 day
('user_sessions', 30, true) -- 30 days
ON CONFLICT (table_name) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'CareXPS Healthcare CRM database setup completed successfully!';
    RAISE NOTICE 'All tables created with HIPAA-compliant security and audit trails.';
    RAISE NOTICE 'Row Level Security (RLS) enabled on all tables.';
END $$;