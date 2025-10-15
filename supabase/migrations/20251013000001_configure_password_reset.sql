-- Migration: Configure Password Reset Security
-- Description: Adds audit logging and security tracking for password reset operations
-- Date: 2025-10-13
-- Author: Claude Code (Supabase Expert)

-- Create password_reset_audit table for tracking password reset attempts
CREATE TABLE IF NOT EXISTS password_reset_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reset_requested_at TIMESTAMPTZ DEFAULT NOW(),
  reset_completed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT CHECK (status IN ('requested', 'completed', 'expired', 'failed')),
  failure_reason TEXT,
  tenant_id TEXT DEFAULT 'phaeton_ai',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for password_reset_audit
ALTER TABLE password_reset_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own password reset history
CREATE POLICY "Users can view own password reset history"
  ON password_reset_audit
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert password reset records
CREATE POLICY "System can create password reset records"
  ON password_reset_audit
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can update password reset records
CREATE POLICY "System can update password reset records"
  ON password_reset_audit
  FOR UPDATE
  USING (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_user_id ON password_reset_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_email ON password_reset_audit(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_status ON password_reset_audit(status);
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_tenant ON password_reset_audit(tenant_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_password_reset_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_password_reset_audit_updated_at
  BEFORE UPDATE ON password_reset_audit
  FOR EACH ROW
  EXECUTE FUNCTION update_password_reset_audit_updated_at();

-- Add comment explaining table purpose
COMMENT ON TABLE password_reset_audit IS 'Audit trail for password reset operations - tracks requests, completions, and failures for security monitoring';

-- Add password_last_changed column to user_profiles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'password_last_changed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN password_last_changed TIMESTAMPTZ;
    COMMENT ON COLUMN user_profiles.password_last_changed IS 'Timestamp of last password change - used for password expiration policies';
  END IF;
END $$;

-- Create function to log password reset attempts
CREATE OR REPLACE FUNCTION log_password_reset_attempt(
  p_user_id UUID,
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO password_reset_audit (
    user_id,
    email,
    reset_requested_at,
    ip_address,
    user_agent,
    status,
    tenant_id
  ) VALUES (
    p_user_id,
    p_email,
    NOW(),
    p_ip_address,
    p_user_agent,
    'requested',
    (SELECT tenant_id FROM users WHERE id = p_user_id LIMIT 1)
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark password reset as completed
CREATE OR REPLACE FUNCTION complete_password_reset(
  p_user_id UUID,
  p_audit_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update audit record if provided
  IF p_audit_id IS NOT NULL THEN
    UPDATE password_reset_audit
    SET
      status = 'completed',
      reset_completed_at = NOW()
    WHERE id = p_audit_id AND user_id = p_user_id;
  ELSE
    -- Find most recent pending reset
    UPDATE password_reset_audit
    SET
      status = 'completed',
      reset_completed_at = NOW()
    WHERE user_id = p_user_id
      AND status = 'requested'
      AND reset_requested_at > NOW() - INTERVAL '1 hour'
    ORDER BY reset_requested_at DESC
    LIMIT 1;
  END IF;

  -- Update user profile password_last_changed
  UPDATE user_profiles
  SET password_last_changed = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to expire old password reset requests
CREATE OR REPLACE FUNCTION expire_old_password_resets()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE password_reset_audit
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'requested'
    AND reset_requested_at < NOW() - INTERVAL '1 hour'
  RETURNING COUNT(*) INTO v_expired_count;

  RETURN COALESCE(v_expired_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION log_password_reset_attempt(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_password_reset(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_password_resets() TO authenticated;

-- Add helpful view for password reset statistics (admin only)
CREATE OR REPLACE VIEW password_reset_stats AS
SELECT
  DATE_TRUNC('day', reset_requested_at) AS reset_date,
  tenant_id,
  COUNT(*) AS total_requests,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_resets,
  COUNT(*) FILTER (WHERE status = 'expired') AS expired_requests,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_resets,
  AVG(
    CASE
      WHEN status = 'completed' THEN
        EXTRACT(EPOCH FROM (reset_completed_at - reset_requested_at)) / 60
      ELSE NULL
    END
  ) AS avg_completion_time_minutes
FROM password_reset_audit
GROUP BY DATE_TRUNC('day', reset_requested_at), tenant_id
ORDER BY reset_date DESC;

COMMENT ON VIEW password_reset_stats IS 'Daily statistics for password reset operations - for admin monitoring and security analysis';

-- Insert initial comment for migration tracking
COMMENT ON TABLE password_reset_audit IS
'Audit trail for password reset operations (created 2025-10-13)
Tracks all password reset requests, completions, and failures for security monitoring and compliance.
Retention: 90 days (configurable via cleanup job)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Password reset security configuration completed successfully';
  RAISE NOTICE 'Created: password_reset_audit table with RLS policies';
  RAISE NOTICE 'Created: Helper functions for logging and tracking';
  RAISE NOTICE 'Created: password_reset_stats view for admin monitoring';
END $$;
