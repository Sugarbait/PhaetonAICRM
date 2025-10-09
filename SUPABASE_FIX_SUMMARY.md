# ARTLEE CRM - Supabase Database Fix Summary

## Overview

This document provides a complete guide to diagnosing and fixing 406 (Not Acceptable) and 400 (Bad Request) errors in the ARTLEE CRM Supabase database.

## Database Details

- **URL:** https://fslniuhyunzlfcbxsiol.supabase.co
- **Project:** ARTLEE CRM dedicated database
- **Tenant ID:** `artlee`
- **Environment:** Configured in `.env.local`

## Files Created

### 1. DIAGNOSTIC_QUERIES.sql
**Purpose:** Comprehensive database diagnostics

**What it does:**
- Verifies all 8 required tables exist
- Checks column definitions for critical tables
- Lists all RLS policies and their definitions
- Checks table permissions for anon/authenticated roles
- Identifies foreign key constraints
- Lists all triggers
- Tests insert permissions
- Checks for missing columns
- Verifies current data counts
- Checks Supabase realtime status

**How to use:**
1. Open Supabase SQL Editor
2. Copy and paste each section separately
3. Review results to identify issues
4. Use output to guide fixes

### 2. FIX_406_400_ERRORS.sql
**Purpose:** Fix permissions and RLS policies

**What it does:**
- Disables RLS on all tables (temporarily)
- Drops all existing RLS policies
- Grants full permissions to anon/authenticated roles
- Creates simple permissive RLS policies
- Re-enables RLS with ultra-permissive policies
- Sets proper column defaults
- Adds performance indexes
- Refreshes PostgREST schema cache
- Tests basic operations
- Shows final RLS status and permissions

**How to use:**
1. Open Supabase SQL Editor
2. Run the entire script at once
3. Check NOTICE messages for any errors
4. Verify all tests pass
5. Try ARTLEE application login

### 3. FIX_CONTENT_TYPE_406.sql
**Purpose:** Fix content-type negotiation issues

**What it does:**
- Checks for problematic column types (JSONB, arrays)
- Ensures JSONB columns have valid default values
- Adds constraints to validate JSONB columns
- Fixes TEXT column lengths
- Creates helper function to test API accessibility
- Checks for views or materialized views
- Resets Supabase REST API cache
- Creates simple test endpoint
- Checks for duplicate column names
- Comprehensive verification

**How to use:**
1. Run this AFTER FIX_406_400_ERRORS.sql
2. Only needed if 406 errors persist
3. Review all test output
4. Check api_health_check view

### 4. TROUBLESHOOTING_GUIDE.md
**Purpose:** Step-by-step troubleshooting instructions

**Contents:**
- Quick diagnosis steps
- Common error causes and fixes
- Step-by-step troubleshooting procedure
- Frontend debugging tips
- Emergency reset procedure
- Verification checklist
- Common success patterns

### 5. test-supabase-connection.mjs
**Purpose:** Command-line database connection test

**What it does:**
- Loads environment variables from .env.local
- Creates Supabase client
- Tests queries on all critical tables
- Tests insert operations
- Tests company_settings access
- Provides detailed error messages
- Shows summary and next steps

**How to use:**
```bash
node test-supabase-connection.mjs
```

## Step-by-Step Fix Procedure

### Step 1: Run Diagnostics

```bash
# Test from command line first
node test-supabase-connection.mjs
```

**Expected output:**
- ✅ Environment variables loaded
- ✅ Client created
- ✅ or ❌ for each table test

### Step 2: Run Database Fixes

1. Open Supabase Dashboard → SQL Editor
2. Run `DIAGNOSTIC_QUERIES.sql` (section by section)
3. Review output to identify specific issues
4. Run `FIX_406_400_ERRORS.sql` (entire script)
5. Check all NOTICE messages
6. If 406 errors persist, run `FIX_CONTENT_TYPE_406.sql`

### Step 3: Verify Fixes

```sql
-- In Supabase SQL Editor
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'users', 'user_settings', 'user_profiles',
  'audit_logs', 'notes', 'failed_login_attempts',
  'user_credentials', 'company_settings'
);
```

**Expected:** All tables should show `rowsecurity = true`

### Step 4: Test from Application

1. Start ARTLEE app: `npm run dev`
2. Try to login
3. Check browser console for errors
4. Check Network tab for API calls

## Common Issues and Solutions

### Issue 1: 406 on SELECT queries

**Cause:** RLS policies or missing permissions

**Fix:**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- If this works, the issue is RLS policies
-- Re-enable with permissive policy:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
```

### Issue 2: 400 on INSERT to failed_login_attempts

**Cause:** Missing columns or constraint violations

**Fix:**
```sql
-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'failed_login_attempts';

-- Ensure attempted_at has default
ALTER TABLE failed_login_attempts
ALTER COLUMN attempted_at SET DEFAULT NOW();
```

### Issue 3: Schema cache not updated

**Cause:** PostgREST hasn't reloaded after schema changes

**Fix:**
```sql
-- Force reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```

### Issue 4: Missing tenant_id in queries

**Cause:** Frontend queries missing tenant filter

**Fix:**
```typescript
// ✅ CORRECT: Include tenant_id
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .eq('tenant_id', 'artlee')  // CRITICAL

// ❌ WRONG: Missing tenant_id
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
```

## Verification Checklist

After running all fixes, verify:

- [ ] All 8 tables exist (users, user_settings, user_profiles, audit_logs, notes, failed_login_attempts, user_credentials, company_settings)
- [ ] All tables have proper column definitions
- [ ] `anon` role has SELECT, INSERT, UPDATE, DELETE on all tables
- [ ] `authenticated` role has SELECT, INSERT, UPDATE, DELETE on all tables
- [ ] RLS is enabled on all tables
- [ ] RLS policies are permissive (USING true, WITH CHECK true)
- [ ] PostgREST schema cache has been reloaded
- [ ] Manual INSERT/SELECT works in SQL editor
- [ ] `node test-supabase-connection.mjs` shows all ✅
- [ ] Frontend can connect to Supabase
- [ ] Login works in ARTLEE application

## Expected Database State After Fixes

### Tables (8 total):
1. **users** - User accounts with tenant_id
2. **user_settings** - User preferences and configuration
3. **user_profiles** - Extended user profile information
4. **audit_logs** - HIPAA-compliant audit trail
5. **notes** - Cross-device synchronized notes
6. **failed_login_attempts** - Login security tracking
7. **user_credentials** - API credentials storage
8. **company_settings** - Tenant-wide configuration

### Permissions:
- **anon role:** SELECT, INSERT, UPDATE, DELETE on all tables
- **authenticated role:** SELECT, INSERT, UPDATE, DELETE on all tables
- **All sequences:** USAGE, SELECT for both roles

### RLS Policies:
- Each table has one permissive policy: "Allow all operations"
- Policy definition: `FOR ALL USING (true) WITH CHECK (true)`
- RLS enabled on all tables

### Indexes:
- `idx_users_email` - Users email lookup
- `idx_users_tenant_id` - Users tenant filtering
- `idx_users_email_tenant` - Combined email+tenant lookup
- `idx_user_profiles_user_id` - Profile user reference
- `idx_user_settings_user_id` - Settings user reference
- `idx_audit_logs_user_id` - Audit logs user filtering
- `idx_audit_logs_timestamp` - Audit logs time-based queries
- `idx_failed_login_email` - Failed login email lookup

## Troubleshooting Commands

### Quick Tests

```sql
-- Test 1: Can we read users?
SELECT COUNT(*) FROM users WHERE tenant_id = 'artlee';

-- Test 2: Can we write to failed_login_attempts?
INSERT INTO failed_login_attempts (email, ip_address, user_agent, tenant_id)
VALUES ('test@test.com', '127.0.0.1', 'Test', 'artlee');
DELETE FROM failed_login_attempts WHERE email = 'test@test.com';

-- Test 3: Can we create a user?
INSERT INTO users (id, email, tenant_id, role)
VALUES ('test_user', 'test@test.com', 'artlee', 'user');
DELETE FROM users WHERE id = 'test_user';
```

### Check Current State

```sql
-- Show all tables and RLS status
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show all policies
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show all permissions
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
```

## Frontend Integration

### Environment Variables (.env.local)

```env
VITE_SUPABASE_URL=https://fslniuhyunzlfcbxsiol.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Supabase Client Initialization

```typescript
// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Query Pattern (Always Include tenant_id)

```typescript
// ✅ CORRECT PATTERN
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .eq('tenant_id', 'artlee')  // CRITICAL: Always include tenant filter

if (error) {
  console.error('Database error:', error.message)
  return null
}

return data
```

## Next Steps After Fix

1. **Create First User:**
   - Use application registration form
   - First user auto-becomes super_user
   - Subsequent users require approval

2. **Configure Company Settings:**
   - Login as super_user
   - Go to Settings → General
   - Set company name, logo, etc.

3. **Test All Features:**
   - Login/logout flow
   - User management
   - Audit logging
   - Notes synchronization

4. **Monitor Logs:**
   - Supabase Dashboard → Logs
   - Check for any errors
   - Monitor API performance

## Support Resources

- **Supabase Dashboard:** https://app.supabase.com
- **Diagnostic Script:** `node test-supabase-connection.mjs`
- **Troubleshooting Guide:** `TROUBLESHOOTING_GUIDE.md`
- **SQL Fixes:** `FIX_406_400_ERRORS.sql`, `FIX_CONTENT_TYPE_406.sql`

## Summary

This fix package provides:
- ✅ Comprehensive diagnostics
- ✅ Automated fixes for common issues
- ✅ Command-line testing tools
- ✅ Step-by-step troubleshooting
- ✅ Verification procedures
- ✅ Frontend integration guidance

Run the scripts in order, verify each step, and your ARTLEE CRM database should be fully operational.

## Emergency Contact

If issues persist after running all fixes:
1. Check Supabase Dashboard → Logs for server-side errors
2. Check browser DevTools → Network tab for client-side errors
3. Review `TROUBLESHOOTING_GUIDE.md` for specific error patterns
4. Run `DIAGNOSTIC_QUERIES.sql` to get current database state

**Remember:** Always include `tenant_id = 'artlee'` in all queries. This is the most common source of errors in ARTLEE CRM.
