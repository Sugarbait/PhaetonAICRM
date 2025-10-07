-- Create secure MFA sessions table
-- Eliminates localStorage vulnerabilities for MFA bypass attacks

CREATE TABLE IF NOT EXISTS public.mfa_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    device_fingerprint TEXT NOT NULL,
    ip_address INET NOT NULL,
    phi_access_enabled BOOLEAN DEFAULT true,
    valid BOOLEAN DEFAULT true,
    invalidated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_token ON public.mfa_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_user_id ON public.mfa_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_expires_at ON public.mfa_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_valid ON public.mfa_sessions(valid);

-- Enable Row Level Security
ALTER TABLE public.mfa_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own sessions
CREATE POLICY "Users can access own MFA sessions"
ON public.mfa_sessions
FOR ALL
USING (user_id::text = auth.uid()::text);

-- RLS Policy: Service role can access all sessions (for cleanup)
CREATE POLICY "Service role can access all MFA sessions"
ON public.mfa_sessions
FOR ALL
USING (auth.role() = 'service_role');

-- Function to automatically cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.mfa_sessions
    SET valid = false,
        invalidated_at = NOW()
    WHERE expires_at < NOW()
    AND valid = true;

    -- Log cleanup activity
    INSERT INTO public.audit_logs (
        id,
        user_id,
        action,
        resource_type,
        outcome,
        timestamp,
        ip_address,
        encrypted_details,
        severity
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'CLEANUP_EXPIRED_SESSIONS',
        'MFA_SESSION',
        'SUCCESS',
        NOW(),
        '127.0.0.1',
        'Automated cleanup of expired MFA sessions',
        'INFO'
    );
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.mfa_sessions TO authenticated;
GRANT ALL ON public.mfa_sessions TO service_role;