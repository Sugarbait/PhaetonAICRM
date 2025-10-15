-- Create password_reset_tokens table for custom password reset system
-- This bypasses Supabase's built-in auth email system and rate limits

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,

  -- Indexes for performance
  CONSTRAINT unique_unused_token UNIQUE (token, user_id)
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only service role can access (backend operations only)
CREATE POLICY "Service role can manage password reset tokens"
  ON public.password_reset_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens
  WHERE expires_at < NOW()
    OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL '24 hours');
END;
$$;

-- Comment on table
COMMENT ON TABLE public.password_reset_tokens IS 'Custom password reset tokens - bypasses Supabase auth email rate limits';
COMMENT ON COLUMN public.password_reset_tokens.token IS 'Secure random token for password reset';
COMMENT ON COLUMN public.password_reset_tokens.expires_at IS 'Token expiration time (1 hour from creation)';
COMMENT ON COLUMN public.password_reset_tokens.used_at IS 'Timestamp when token was used (NULL if unused)';
