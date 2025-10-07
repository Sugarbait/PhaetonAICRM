-- Add system credentials table for bulletproof credential persistence
-- This table stores system-wide default credentials and user-specific overrides

CREATE TABLE IF NOT EXISTS system_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_type VARCHAR(50) NOT NULL CHECK (credential_type IN ('system_defaults', 'user_override')),
  api_key TEXT NOT NULL,
  call_agent_id TEXT NOT NULL,
  sms_agent_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_credentials_type_active
  ON system_credentials(credential_type, is_active);

CREATE INDEX IF NOT EXISTS idx_system_credentials_user_type
  ON system_credentials(user_id, credential_type)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_credentials_system_defaults
  ON system_credentials(credential_type)
  WHERE credential_type = 'system_defaults' AND is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_credentials_user_override
  ON system_credentials(user_id, credential_type)
  WHERE credential_type = 'user_override' AND is_active = true AND user_id IS NOT NULL;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_system_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_system_credentials_updated_at
  BEFORE UPDATE ON system_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_system_credentials_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE system_credentials ENABLE ROW LEVEL SECURITY;

-- System defaults can be read by all authenticated users
CREATE POLICY "system_defaults_read" ON system_credentials
  FOR SELECT USING (
    credential_type = 'system_defaults' AND
    is_active = true AND
    auth.role() = 'authenticated'
  );

-- Users can read their own credential overrides
CREATE POLICY "user_credentials_read" ON system_credentials
  FOR SELECT USING (
    credential_type = 'user_override' AND
    user_id = auth.uid() AND
    is_active = true
  );

-- Users can insert/update their own credential overrides
CREATE POLICY "user_credentials_write" ON system_credentials
  FOR ALL USING (
    credential_type = 'user_override' AND
    user_id = auth.uid()
  );

-- Only service role can manage system defaults
CREATE POLICY "system_defaults_write" ON system_credentials
  FOR ALL USING (
    credential_type = 'system_defaults' AND
    auth.role() = 'service_role'
  );

-- Cleanup function for old credentials
CREATE OR REPLACE FUNCTION cleanup_old_system_credentials()
RETURNS void AS $$
BEGIN
  -- Mark old user overrides as inactive (keep only latest per user)
  UPDATE system_credentials
  SET is_active = false
  WHERE credential_type = 'user_override'
    AND is_active = true
    AND created_at < (
      SELECT MAX(created_at)
      FROM system_credentials sc2
      WHERE sc2.user_id = system_credentials.user_id
        AND sc2.credential_type = 'user_override'
        AND sc2.is_active = true
    );

  -- Mark old system defaults as inactive (keep only latest)
  UPDATE system_credentials
  SET is_active = false
  WHERE credential_type = 'system_defaults'
    AND is_active = true
    AND created_at < (
      SELECT MAX(created_at)
      FROM system_credentials sc2
      WHERE sc2.credential_type = 'system_defaults'
        AND sc2.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on cleanup function to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_old_system_credentials() TO authenticated;

-- Insert system default credentials (bulletproof values)
INSERT INTO system_credentials (
  credential_type,
  api_key,
  call_agent_id,
  sms_agent_id,
  is_active,
  metadata
) VALUES (
  'system_defaults',
  'key_c3f084f5ca67781070e188b47d7f',
  'agent_447a1b9da540237693b0440df6',
  'agent_643486efd4b5a0e9d7e094ab99',
  true,
  '{
    "source": "migration_hardcoded",
    "purpose": "system_wide_bulletproof_defaults",
    "created_by": "system_migration",
    "version": "1.0"
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE system_credentials IS 'Stores system-wide default Retell AI credentials and user-specific overrides for bulletproof persistence across devices and users';
COMMENT ON COLUMN system_credentials.credential_type IS 'Type of credential: system_defaults for global fallback, user_override for user-specific settings';
COMMENT ON COLUMN system_credentials.is_active IS 'Whether this credential record is currently active (allows for soft deletion and versioning)';
COMMENT ON COLUMN system_credentials.metadata IS 'Additional metadata about the credential record (source, purpose, version, etc.)';