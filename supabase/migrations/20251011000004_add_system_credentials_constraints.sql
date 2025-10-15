-- Migration: Add unique constraints to existing system_credentials table
-- Date: 2025-10-11
-- Purpose: Add missing unique constraints to system_credentials table
--
-- This migration adds the unique constraints required for ON CONFLICT clauses
-- to work properly when upserting credentials. The table already exists but
-- is missing these critical constraints.

-- Drop existing indexes if they exist (idempotent operation)
DROP INDEX IF EXISTS idx_system_credentials_system_defaults;
DROP INDEX IF EXISTS idx_system_credentials_user_override;
DROP INDEX IF EXISTS idx_system_credentials_tenant_id;
DROP INDEX IF EXISTS idx_system_credentials_user_id;
DROP INDEX IF EXISTS idx_system_credentials_active;

-- Create unique constraint for system defaults per tenant
-- This allows only one active system_defaults record per tenant
CREATE UNIQUE INDEX idx_system_credentials_system_defaults
ON system_credentials(tenant_id, credential_type, is_active)
WHERE credential_type = 'system_defaults' AND is_active = true;

-- Create unique constraint for user overrides
-- This is the CRITICAL constraint that fixes the ON CONFLICT error
-- Format: onConflict: 'user_id,credential_type,tenant_id'
CREATE UNIQUE INDEX idx_system_credentials_user_override
ON system_credentials(user_id, credential_type, tenant_id)
WHERE credential_type = 'user_override' AND user_id IS NOT NULL;

-- Create index for tenant isolation (performance optimization)
CREATE INDEX idx_system_credentials_tenant_id ON system_credentials(tenant_id);

-- Create index for user lookups (performance optimization)
CREATE INDEX idx_system_credentials_user_id ON system_credentials(user_id)
WHERE user_id IS NOT NULL;

-- Create index for active credentials (performance optimization)
CREATE INDEX idx_system_credentials_active ON system_credentials(is_active, credential_type);

-- Verify constraints were created successfully
DO $$
DECLARE
  system_defaults_exists BOOLEAN;
  user_override_exists BOOLEAN;
BEGIN
  -- Check if system defaults index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_system_credentials_system_defaults'
  ) INTO system_defaults_exists;

  -- Check if user override index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_system_credentials_user_override'
  ) INTO user_override_exists;

  IF system_defaults_exists AND user_override_exists THEN
    RAISE NOTICE 'Migration successful: Unique constraints added to system_credentials table';
    RAISE NOTICE 'ON CONFLICT clause will now work correctly for credential upserts';
  ELSE
    RAISE EXCEPTION 'Migration failed: Unique constraints not found on system_credentials table';
  END IF;
END $$;
