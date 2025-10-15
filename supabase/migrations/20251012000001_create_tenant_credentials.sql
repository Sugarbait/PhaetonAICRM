-- Create tenant-level credential storage table
-- All users in the same tenant share the same API keys and Agent IDs
-- Created: 2025-10-12

CREATE TABLE IF NOT EXISTS tenant_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,

  -- Retell AI Credentials (shared across all tenant users)
  retell_api_key TEXT,
  call_agent_id TEXT,
  sms_agent_id TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT unique_tenant_credentials UNIQUE(tenant_id)
);

-- Create index for fast tenant lookup
CREATE INDEX IF NOT EXISTS idx_tenant_credentials_tenant_id ON tenant_credentials(tenant_id);

-- Enable RLS (Row Level Security)
ALTER TABLE tenant_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users in a tenant can read their tenant's credentials
CREATE POLICY "Users can read their tenant credentials"
  ON tenant_credentials
  FOR SELECT
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Policy: Only authenticated users can update their tenant's credentials
CREATE POLICY "Users can update their tenant credentials"
  ON tenant_credentials
  FOR UPDATE
  TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

-- Policy: Only authenticated users can insert their tenant's credentials
CREATE POLICY "Users can insert their tenant credentials"
  ON tenant_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tenant_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenant_credentials_timestamp
  BEFORE UPDATE ON tenant_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_credentials_updated_at();

-- Insert initial record for phaeton_ai tenant with Pierre's credentials
INSERT INTO tenant_credentials (tenant_id, retell_api_key, call_agent_id, sms_agent_id)
VALUES (
  'phaeton_ai',
  'key_cda2021a151b9a84e721299f2c04',
  'agent_544379e4fc2a465b7e8eb6fd19',
  ''
)
ON CONFLICT (tenant_id) DO UPDATE SET
  retell_api_key = EXCLUDED.retell_api_key,
  call_agent_id = EXCLUDED.call_agent_id,
  sms_agent_id = EXCLUDED.sms_agent_id,
  updated_at = NOW();

COMMENT ON TABLE tenant_credentials IS 'Tenant-level API credentials shared by all users in the tenant';
COMMENT ON COLUMN tenant_credentials.retell_api_key IS 'Retell AI API key shared across tenant';
COMMENT ON COLUMN tenant_credentials.call_agent_id IS 'Call Agent ID for voice calls';
COMMENT ON COLUMN tenant_credentials.sms_agent_id IS 'SMS/Chat Agent ID for messaging';
COMMENT ON COLUMN tenant_credentials.updated_by IS 'User ID who last updated the credentials';
