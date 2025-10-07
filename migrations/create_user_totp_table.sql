-- Create user_totp table for TOTP authentication data
-- This table stores encrypted TOTP secrets and backup codes for multi-factor authentication

-- Create the table
CREATE TABLE IF NOT EXISTS user_totp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_secret TEXT NOT NULL,
    backup_codes JSONB DEFAULT '[]'::jsonb,
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Add unique constraint to ensure one TOTP setup per user
ALTER TABLE user_totp ADD CONSTRAINT user_totp_user_id_unique UNIQUE (user_id);

-- Create index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_user_totp_user_id ON user_totp(user_id);

-- Create index on enabled status for performance queries
CREATE INDEX IF NOT EXISTS idx_user_totp_enabled ON user_totp(enabled);

-- Enable Row Level Security
ALTER TABLE user_totp ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own TOTP data
CREATE POLICY "Users can access their own TOTP data" ON user_totp
    FOR ALL USING (auth.uid()::text = user_id);

-- Alternative policy for authenticated users (if using service role for admin access)
-- CREATE POLICY "Users can access their own TOTP data" ON user_totp
--     FOR ALL USING (
--         auth.uid() = user_id OR
--         auth.jwt() ->> 'role' = 'service_role'
--     );

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_totp TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Optional: Create a function to safely delete TOTP data (with audit logging)
CREATE OR REPLACE FUNCTION delete_user_totp(target_user_id TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify the requesting user can only delete their own TOTP data
    IF auth.uid()::text != target_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot delete TOTP data for other users';
    END IF;

    -- Delete the TOTP record
    DELETE FROM user_totp WHERE user_id = target_user_id;

    -- Log the deletion (optional - integrate with your audit system)
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        outcome,
        timestamp
    ) VALUES (
        auth.uid(),
        'DELETE',
        'user_totp',
        'SUCCESS',
        NOW()
    );

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Create a view for checking TOTP status (without exposing sensitive data)
CREATE OR REPLACE VIEW user_totp_status AS
SELECT
    user_id,
    enabled,
    created_at,
    last_used_at,
    (backup_codes IS NOT NULL AND jsonb_array_length(backup_codes) > 0) AS has_backup_codes
FROM user_totp
WHERE auth.uid()::text = user_id;

-- Grant access to the view
GRANT SELECT ON user_totp_status TO authenticated;

-- Optional: Create function to update last_used_at timestamp
CREATE OR REPLACE FUNCTION update_totp_last_used(target_user_id TEXT)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify the requesting user can only update their own TOTP data
    IF auth.uid()::text != target_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot update TOTP data for other users';
    END IF;

    UPDATE user_totp
    SET last_used_at = NOW()
    WHERE user_id = target_user_id;
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE user_totp IS 'Stores encrypted TOTP secrets and backup codes for multi-factor authentication';
COMMENT ON COLUMN user_totp.id IS 'Unique identifier for the TOTP record';
COMMENT ON COLUMN user_totp.user_id IS 'Reference to the user who owns this TOTP setup';
COMMENT ON COLUMN user_totp.encrypted_secret IS 'Encrypted TOTP secret key (use AES-256-GCM)';
COMMENT ON COLUMN user_totp.backup_codes IS 'Array of encrypted backup codes for account recovery';
COMMENT ON COLUMN user_totp.enabled IS 'Whether TOTP is currently enabled for this user';
COMMENT ON COLUMN user_totp.created_at IS 'When the TOTP was first set up';
COMMENT ON COLUMN user_totp.last_used_at IS 'Last time TOTP was successfully used for authentication';

-- Example usage queries (commented out):
--
-- -- Insert a new TOTP record
-- INSERT INTO user_totp (user_id, encrypted_secret, backup_codes, enabled)
-- VALUES (
--     auth.uid(),
--     'encrypted_secret_here',
--     '["encrypted_code1", "encrypted_code2", "encrypted_code3"]'::jsonb,
--     true
-- );
--
-- -- Check if user has TOTP enabled
-- SELECT enabled FROM user_totp WHERE user_id = auth.uid();
--
-- -- Update TOTP status
-- UPDATE user_totp SET enabled = true WHERE user_id = auth.uid();
--
-- -- Use a backup code (remove it from the array)
-- UPDATE user_totp
-- SET backup_codes = backup_codes - 'used_backup_code'
-- WHERE user_id = auth.uid();