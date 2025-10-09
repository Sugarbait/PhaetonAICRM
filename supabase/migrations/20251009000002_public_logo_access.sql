-- Migration: Allow public read access to company logos
-- Date: 2025-10-09
-- Reason: Company logos need to be accessible on the login page without authentication
-- Security: Only SELECT is public. INSERT/UPDATE/DELETE still require super_user role

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Allow public read access to company logos" ON company_settings;
DROP POLICY IF EXISTS "Allow super users to manage company settings" ON company_settings;

-- Create public read policy for company logos
-- This allows the login page to display logos without authentication
CREATE POLICY "Allow public read access to company logos"
ON company_settings
FOR SELECT
TO public
USING (
  -- Only allow reading company logo settings
  name = 'company_logos'
);

-- Create super user write policy
-- Only super users can create, update, or delete company settings
CREATE POLICY "Allow super users to manage company settings"
ON company_settings
FOR ALL
TO authenticated
USING (
  -- Check if user is super_user by looking up their role in users table
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role = 'super_user'
  )
)
WITH CHECK (
  -- Same check for INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role = 'super_user'
  )
);

-- Add comment to document the policy
COMMENT ON POLICY "Allow public read access to company logos" ON company_settings IS
'Allows unauthenticated users to view company logos on the login page. Only company_logos settings are publicly readable.';

COMMENT ON POLICY "Allow super users to manage company settings" ON company_settings IS
'Only super users can create, update, or delete company settings. Enforced at database level for security.';
