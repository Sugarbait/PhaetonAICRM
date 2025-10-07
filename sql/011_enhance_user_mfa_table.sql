-- Enhance user_mfa table for server-side MFA validation
-- Adds security controls to prevent MFA bypass attacks

-- Create enhanced user_mfa table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_mfa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_secret TEXT NOT NULL, -- TOTP secret encrypted server-side
    backup_codes TEXT[] DEFAULT '{}', -- Encrypted backup codes
    enabled BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false, -- Whether user has completed initial setup
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Security constraints
    CONSTRAINT unique_user_mfa UNIQUE (user_id),
    CONSTRAINT valid_failed_attempts CHECK (failed_attempts >= 0),
    CONSTRAINT max_backup_codes CHECK (array_length(backup_codes, 1) <= 10)
);

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
    -- Add failed_attempts column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_mfa' AND column_name = 'failed_attempts') THEN
        ALTER TABLE public.user_mfa ADD COLUMN failed_attempts INTEGER DEFAULT 0;
    END IF;

    -- Add locked_until column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_mfa' AND column_name = 'locked_until') THEN
        ALTER TABLE public.user_mfa ADD COLUMN locked_until TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_mfa' AND column_name = 'verified') THEN
        ALTER TABLE public.user_mfa ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;

    -- Add last_used_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_mfa' AND column_name = 'last_used_at') THEN
        ALTER TABLE public.user_mfa ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- Create indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON public.user_mfa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_enabled ON public.user_mfa(enabled);
CREATE INDEX IF NOT EXISTS idx_user_mfa_locked_until ON public.user_mfa(locked_until);

-- Enable Row Level Security
ALTER TABLE public.user_mfa ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own MFA data
CREATE POLICY "Users can access own MFA data"
ON public.user_mfa
FOR ALL
USING (user_id::text = auth.uid()::text);

-- RLS Policy: Service role can access all MFA data (for server-side validation)
CREATE POLICY "Service role can access all MFA data"
ON public.user_mfa
FOR ALL
USING (auth.role() = 'service_role');

-- Function to reset failed attempts after successful authentication
CREATE OR REPLACE FUNCTION reset_mfa_failed_attempts(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_mfa
    SET failed_attempts = 0,
        locked_until = NULL,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE user_id = target_user_id;
END;
$$;

-- Function to increment failed attempts and apply lockout
CREATE OR REPLACE FUNCTION increment_mfa_failed_attempts(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_attempts INTEGER;
    lockout_duration INTERVAL := '30 minutes';
    max_attempts INTEGER := 3;
BEGIN
    UPDATE public.user_mfa
    SET failed_attempts = failed_attempts + 1,
        updated_at = NOW(),
        locked_until = CASE
            WHEN failed_attempts + 1 >= max_attempts
            THEN NOW() + lockout_duration
            ELSE locked_until
        END
    WHERE user_id = target_user_id
    RETURNING failed_attempts INTO new_attempts;

    RETURN COALESCE(new_attempts, 0);
END;
$$;

-- Function to check if user is locked out
CREATE OR REPLACE FUNCTION is_mfa_locked_out(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lockout_time TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT locked_until INTO lockout_time
    FROM public.user_mfa
    WHERE user_id = target_user_id;

    RETURN lockout_time IS NOT NULL AND lockout_time > NOW();
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.user_mfa TO authenticated;
GRANT ALL ON public.user_mfa TO service_role;
GRANT EXECUTE ON FUNCTION reset_mfa_failed_attempts(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_mfa_failed_attempts(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION is_mfa_locked_out(UUID) TO service_role;