-- Fix failed_login_attempts table schema
-- Add missing columns and rename attempt_time to attempted_at

-- Add missing columns
ALTER TABLE failed_login_attempts
ADD COLUMN IF NOT EXISTS user_agent TEXT;

ALTER TABLE failed_login_attempts
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Rename attempt_time to attempted_at (if attempt_time exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'failed_login_attempts'
    AND column_name = 'attempt_time'
  ) THEN
    ALTER TABLE failed_login_attempts
    RENAME COLUMN attempt_time TO attempted_at;
  END IF;
END $$;

-- Add attempted_at column if it doesn't exist (for fresh installs)
ALTER TABLE failed_login_attempts
ADD COLUMN IF NOT EXISTS attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email
  ON failed_login_attempts(email);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at
  ON failed_login_attempts(attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email_attempted_at
  ON failed_login_attempts(email, attempted_at DESC);

-- Update RLS policies (ensure they exist)
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous inserts for failed login tracking" ON failed_login_attempts;
DROP POLICY IF EXISTS "Allow authenticated inserts for failed login tracking" ON failed_login_attempts;
DROP POLICY IF EXISTS "Users can view their own failed login attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Super users can view all failed login attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Users can delete their own failed login attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Super users can delete all failed login attempts" ON failed_login_attempts;

-- Create policies
CREATE POLICY "Allow anonymous inserts for failed login tracking"
  ON failed_login_attempts
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated inserts for failed login tracking"
  ON failed_login_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own failed login attempts"
  ON failed_login_attempts
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM users WHERE id = auth.uid() LIMIT 1));

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

CREATE POLICY "Users can delete their own failed login attempts"
  ON failed_login_attempts
  FOR DELETE
  TO authenticated
  USING (email = (SELECT email FROM users WHERE id = auth.uid() LIMIT 1));

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

-- Add column comments
COMMENT ON COLUMN failed_login_attempts.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN failed_login_attempts.reason IS 'Reason for the failed login (e.g., "Invalid password", "Account locked")';
COMMENT ON COLUMN failed_login_attempts.attempted_at IS 'Timestamp of the failed login attempt';
