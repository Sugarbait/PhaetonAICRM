-- Migration: Create system_credentials table
-- Date: 2025-10-11
-- Purpose: Create system_credentials table for cloud-based credential storage
--
-- This migration creates the system_credentials table used by cloudCredentialService
-- to store system-wide default credentials and user-specific credential overrides
-- with proper tenant isolation and cross-device synchronization.

-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS system_credentials CASCADE;

-- Create system_credentials table
CREATE TABLE system_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_type TEXT NOT NULL CHECK (credential_type IN ('system_defaults', 'user_override')),
  api_key TEXT NOT NULL DEFAULT '',
  call_agent_id TEXT NOT NULL DEFAULT '',
  sms_agent_id TEXT NOT NULL DEFAULT '',
  tenant_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique constraint for system defaults per tenant
CREATE UNIQUE INDEX idx_system_credentials_system_defaults
ON system_credentials(tenant_id, credential_type, is_active)
WHERE credential_type = 'system_defaults' AND is_active = true;

-- Create unique constraint for user overrides
CREATE UNIQUE INDEX idx_system_credentials_user_override
ON system_credentials(user_id, credential_type, tenant_id)
WHERE credential_type = 'user_override' AND user_id IS NOT NULL;

-- Create index for tenant isolation
CREATE INDEX idx_system_credentials_tenant_id ON system_credentials(tenant_id);

-- Create index for user lookups
CREATE INDEX idx_system_credentials_user_id ON system_credentials(user_id)
WHERE user_id IS NOT NULL;

-- Create index for active credentials
CREATE INDEX idx_system_credentials_active ON system_credentials(is_active, credential_type);

-- Add comments for documentation
COMMENT ON TABLE system_credentials IS 'Stores system-wide default credentials and user-specific credential overrides with tenant isolation';
COMMENT ON COLUMN system_credentials.id IS 'Primary key UUID';
COMMENT ON COLUMN system_credentials.credential_type IS 'Type of credential: system_defaults or user_override';
COMMENT ON COLUMN system_credentials.api_key IS 'Retell AI API key';
COMMENT ON COLUMN system_credentials.call_agent_id IS 'Retell AI Call Agent ID';
COMMENT ON COLUMN system_credentials.sms_agent_id IS 'Retell AI SMS Agent ID';
COMMENT ON COLUMN system_credentials.tenant_id IS 'Tenant identifier (artlee, medex, carexps, phaeton_ai)';
COMMENT ON COLUMN system_credentials.user_id IS 'User ID for user_override type (NULL for system_defaults)';
COMMENT ON COLUMN system_credentials.is_active IS 'Whether this credential set is active';
COMMENT ON COLUMN system_credentials.metadata IS 'Additional metadata (source, purpose, timestamps)';

-- Enable Row Level Security
ALTER TABLE system_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own credentials and system defaults for their tenant
CREATE POLICY "Users can read own credentials and system defaults"
ON system_credentials
FOR SELECT
USING (
  tenant_id = current_setting('app.current_tenant_id', true)
  AND (
    credential_type = 'system_defaults'
    OR (credential_type = 'user_override' AND user_id = auth.uid())
  )
);

-- RLS Policy: Users can insert/update their own credential overrides
CREATE POLICY "Users can manage own credential overrides"
ON system_credentials
FOR ALL
USING (
  tenant_id = current_setting('app.current_tenant_id', true)
  AND credential_type = 'user_override'
  AND user_id = auth.uid()
)
WITH CHECK (
  tenant_id = current_setting('app.current_tenant_id', true)
  AND credential_type = 'user_override'
  AND user_id = auth.uid()
);

-- RLS Policy: Super users can manage all credentials (including system defaults)
CREATE POLICY "Super users can manage all credentials"
ON system_credentials
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'super_user'
    AND users.tenant_id = current_setting('app.current_tenant_id', true)
  )
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER system_credentials_updated_at
BEFORE UPDATE ON system_credentials
FOR EACH ROW
EXECUTE FUNCTION update_system_credentials_updated_at();

-- Create cleanup function for old credentials
CREATE OR REPLACE FUNCTION cleanup_old_system_credentials()
RETURNS void AS $$
BEGIN
  -- Mark old user overrides as inactive (keep only latest 5 per user)
  WITH ranked_credentials AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, tenant_id
             ORDER BY updated_at DESC
           ) as rn
    FROM system_credentials
    WHERE credential_type = 'user_override'
    AND user_id IS NOT NULL
  )
  UPDATE system_credentials
  SET is_active = false
  WHERE id IN (
    SELECT id FROM ranked_credentials WHERE rn > 5
  );
END;
$$ LANGUAGE plpgsql;

-- Verify table was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'system_credentials'
  ) THEN
    RAISE NOTICE 'Migration successful: system_credentials table created with proper constraints and RLS policies';
  ELSE
    RAISE EXCEPTION 'Migration failed: system_credentials table not found';
  END IF;
END $$;
