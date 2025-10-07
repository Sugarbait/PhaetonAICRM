-- Add last_login column to users table if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- Add index for performance on last_login queries
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Update existing users to set last_login to created_at as a default
-- (Only for users where last_login is NULL)
UPDATE users
SET last_login = created_at
WHERE last_login IS NULL AND created_at IS NOT NULL;

-- Add comment to column
COMMENT ON COLUMN users.last_login IS 'Timestamp of the users last successful login';