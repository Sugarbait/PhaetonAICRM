-- Create failed_login_attempts table for MFA lockout tracking
-- This table tracks failed login attempts to prevent brute-force attacks

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  reason TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT failed_login_attempts_attempted_at_idx_constraint CHECK (attempted_at IS NOT NULL)
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email
  ON failed_login_attempts(email);

-- Create index on attempted_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at
  ON failed_login_attempts(attempted_at DESC);

-- Create composite index for most common query pattern
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email_attempted_at
  ON failed_login_attempts(email, attempted_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for recording failed login attempts before authentication)
CREATE POLICY "Allow anonymous inserts for failed login tracking"
  ON failed_login_attempts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated inserts (for recording failed attempts)
CREATE POLICY "Allow authenticated inserts for failed login tracking"
  ON failed_login_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to view their own failed attempts
CREATE POLICY "Users can view their own failed login attempts"
  ON failed_login_attempts
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Policy: Allow super users to view all failed attempts
CREATE POLICY "Super users can view all failed login attempts"
  ON failed_login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_user'
    )
  );

-- Policy: Allow authenticated users to delete their own failed attempts
CREATE POLICY "Users can delete their own failed login attempts"
  ON failed_login_attempts
  FOR DELETE
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Policy: Allow super users to delete any failed attempts
CREATE POLICY "Super users can delete all failed login attempts"
  ON failed_login_attempts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_user'
    )
  );

-- Add comment to table
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for security monitoring and account lockout protection';

-- Add comments to columns
COMMENT ON COLUMN failed_login_attempts.email IS 'Email address of the failed login attempt';
COMMENT ON COLUMN failed_login_attempts.ip_address IS 'IP address of the failed login attempt';
COMMENT ON COLUMN failed_login_attempts.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN failed_login_attempts.reason IS 'Reason for the failed login (e.g., "Invalid password", "Account locked")';
COMMENT ON COLUMN failed_login_attempts.attempted_at IS 'Timestamp of the failed login attempt';

-- Create function to automatically clean up old failed login attempts (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_failed_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM failed_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '30 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_failed_login_attempts IS 'Removes failed login attempts older than 30 days';
