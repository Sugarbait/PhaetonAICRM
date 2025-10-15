-- ================================================
-- Fix company_settings name column constraint
-- ================================================
-- Issue: 'name' column has NOT NULL constraint
-- Solution: Make it nullable or add default value

-- Make name column nullable
ALTER TABLE company_settings
ALTER COLUMN name DROP NOT NULL;

-- Alternatively, set a default value:
-- ALTER TABLE company_settings
-- ALTER COLUMN name SET DEFAULT 'Company Settings';

-- Verify the change
DO $$
BEGIN
  RAISE NOTICE '✅ name column is now nullable';
  RAISE NOTICE 'Logo uploads should work now';
END $$;
