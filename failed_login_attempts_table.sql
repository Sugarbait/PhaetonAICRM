-- Create the missing failed_login_attempts table for CareXPS Healthcare CRM
-- This table is required for security tracking and user management

-- Create the failed_login_attempts table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    reason TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at ON failed_login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip_address ON failed_login_attempts(ip_address);

-- Enable Row Level Security
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON failed_login_attempts;
CREATE POLICY "Enable read access for authenticated users" ON failed_login_attempts
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for system logging" ON failed_login_attempts;
CREATE POLICY "Enable insert for system logging" ON failed_login_attempts
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for cleanup" ON failed_login_attempts;
CREATE POLICY "Enable delete for cleanup" ON failed_login_attempts
    FOR DELETE USING (true);

-- Grant necessary permissions
GRANT ALL ON failed_login_attempts TO postgres, service_role;
GRANT SELECT, INSERT, DELETE ON failed_login_attempts TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Add a comment for documentation
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for security monitoring and account lockout functionality';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'failed_login_attempts table created successfully!';
    RAISE NOTICE 'This table will resolve 400 errors related to failed login tracking.';
END $$;