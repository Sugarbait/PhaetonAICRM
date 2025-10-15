-- Migration: Fix users table UUID default
-- Date: 2025-10-10
-- Purpose: Ensure users.id column automatically generates UUIDs to prevent "null value in column id" errors during registration
-- Tenant: phaeton_ai

-- Check current state
DO $$
BEGIN
  RAISE NOTICE 'Checking users table UUID default configuration...';
END $$;

-- Set UUID default for users.id column
ALTER TABLE users
ALTER COLUMN id
SET DEFAULT gen_random_uuid();

-- Verify the change
DO $$
DECLARE
  default_value TEXT;
BEGIN
  SELECT column_default INTO default_value
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'id';

  IF default_value LIKE '%gen_random_uuid%' THEN
    RAISE NOTICE '✅ SUCCESS: users.id column now has UUID default: %', default_value;
  ELSE
    RAISE WARNING '⚠️ WARNING: users.id column default may not be set correctly: %', default_value;
  END IF;
END $$;

-- Test insert (this will rollback)
DO $$
DECLARE
  test_id UUID;
BEGIN
  -- Try inserting a user without providing an ID
  INSERT INTO users (email, name, role, is_active, tenant_id, last_login)
  VALUES ('test@test.com', 'Test User', 'user', true, 'phaeton_ai', null)
  RETURNING id INTO test_id;

  RAISE NOTICE '✅ TEST PASSED: Successfully created user with auto-generated ID: %', test_id;

  -- Clean up test user
  DELETE FROM users WHERE id = test_id;
  RAISE NOTICE '🧹 Cleaned up test user';

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ TEST FAILED: %', SQLERRM;
END $$;
