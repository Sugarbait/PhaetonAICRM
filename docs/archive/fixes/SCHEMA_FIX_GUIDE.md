# ARTLEE CRM Schema Fix Guide

## Problem Summary

The ARTLEE CRM application is showing these schema cache errors:

1. ❌ "Could not find the 'mfa_enabled' column of 'users' in the schema cache"
2. ❌ "Could not find the 'phi_accessed' column of 'audit_logs' in the schema cache"
3. ❌ "Could not find the table 'public.user_profiles' in the schema cache"

## Root Cause

The ARTLEE database was created from a MedEx schema copy, but is missing several columns and tables that the ARTLEE application code expects:

### Missing from `user_settings` table:
- `fresh_mfa_secret` (TEXT)
- `fresh_mfa_enabled` (BOOLEAN)
- `fresh_mfa_setup_completed` (BOOLEAN)
- `fresh_mfa_backup_codes` (TEXT)

### Missing from `users` table:
- `mfa_enabled` (BOOLEAN) - for backwards compatibility

### Missing from `audit_logs` table:
- `phi_accessed` (BOOLEAN) - may exist but schema cache is stale

### Missing table:
- `user_profiles` - completely missing from the database

## Solution

A comprehensive migration script has been created that will:

1. ✅ Add 4 Fresh MFA columns to `user_settings` table
2. ✅ Add `mfa_enabled` to `users` table (backwards compatibility)
3. ✅ Verify/add `phi_accessed` column to `audit_logs` table
4. ✅ Create `user_profiles` table with proper RLS policies
5. ✅ Auto-create user profiles for existing users
6. ✅ Add tenant isolation support (`tenant_id = 'artlee'`)

## How to Apply the Fix

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project: https://fslniuhyunzlfcbxsiol.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration

1. Open the migration file: `supabase/migrations/20251009000001_fix_artlee_schema.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** button

### Step 3: Verify Success

You should see output like this:

```
NOTICE: Added fresh_mfa_secret column to user_settings
NOTICE: Added fresh_mfa_enabled column to user_settings
NOTICE: Added fresh_mfa_setup_completed column to user_settings
NOTICE: Added fresh_mfa_backup_codes column to user_settings
NOTICE: Added mfa_enabled column to users table
NOTICE: Column phi_accessed already exists in audit_logs
NOTICE: =================================================================
NOTICE: ARTLEE CRM Schema Fix - Verification Results
NOTICE: =================================================================
NOTICE: MFA columns in user_settings: 4 of 4
NOTICE: phi_accessed column in audit_logs: 1 (expected: 1)
NOTICE: user_profiles table exists: 1 (expected: 1)
NOTICE: =================================================================
NOTICE: ✅ SUCCESS: All schema fixes applied successfully!
```

### Step 4: Refresh Application

1. Clear your browser cache (Ctrl+Shift+Delete)
2. Hard refresh the application (Ctrl+F5)
3. Verify no schema cache errors appear

## What the Migration Does

### Section 1: MFA Columns in user_settings
Adds the 4 Fresh MFA columns that ARTLEE's `freshMfaService.ts` expects:
- Stores TOTP secrets
- Tracks MFA enabled status
- Tracks setup completion
- Stores backup codes

### Section 2: users.mfa_enabled
Adds backwards compatibility column in case any legacy code still references it.

### Section 3: audit_logs.phi_accessed
Verifies/adds the HIPAA compliance flag for PHI access tracking.

### Section 4: user_profiles Table
Creates the complete user_profiles table with:
- Extended profile fields (display_name, department, phone, bio, location)
- Tenant isolation support
- RLS policies for security
- Indexes for performance
- Service role access

### Section 5: Auto-Create Profiles
Automatically creates user_profiles entries for any existing users in the `users` table.

### Section 6: Verification
Runs automated checks to ensure all fixes were applied successfully.

## Expected Database State After Migration

### user_settings table (MFA columns added):
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  -- ... existing columns ...
  fresh_mfa_secret TEXT,                    -- NEW
  fresh_mfa_enabled BOOLEAN DEFAULT false,   -- NEW
  fresh_mfa_setup_completed BOOLEAN DEFAULT false, -- NEW
  fresh_mfa_backup_codes TEXT,              -- NEW
  tenant_id TEXT NOT NULL DEFAULT 'artlee'
);
```

### users table (mfa_enabled added):
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  -- ... existing columns ...
  mfa_enabled BOOLEAN DEFAULT false,        -- NEW
  tenant_id TEXT NOT NULL DEFAULT 'artlee'
);
```

### audit_logs table (phi_accessed verified):
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  phi_accessed BOOLEAN DEFAULT false,       -- VERIFIED
  -- ... other columns ...
  tenant_id TEXT NOT NULL DEFAULT 'artlee'
);
```

### user_profiles table (created):
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  display_name TEXT,
  department TEXT,
  phone TEXT,
  bio TEXT,
  location TEXT,
  timezone TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  tenant_id TEXT NOT NULL DEFAULT 'artlee',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Troubleshooting

### If migration fails with "column already exists"
This is normal - the script uses `IF NOT EXISTS` checks and will skip existing columns.

### If you still see schema cache errors after migration
1. Wait 30 seconds for Supabase to refresh the schema cache
2. Hard refresh your browser (Ctrl+F5)
3. Clear localStorage: Open DevTools → Application → Local Storage → Clear All
4. Restart the application

### If user_profiles table shows "permission denied"
The RLS policies should grant full access. If issues persist:
```sql
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.user_profiles TO anon;
```

## MFA Implementation Details

ARTLEE uses `user_settings` table for MFA storage (different from MedEx which uses `users` table):

**Fresh MFA Service** (`src/services/freshMfaService.ts`):
- Reads from: `user_settings.fresh_mfa_*` columns
- Stores TOTP secrets in plain text (no encryption to avoid corruption)
- Backup codes stored as JSON string
- Setup completion tracked separately from enabled status

**Why user_settings instead of users?**
- Allows per-user configuration
- Supports cross-device sync via Supabase
- Separates authentication from user profile data
- Matches ARTLEE's architecture pattern

## Next Steps After Migration

1. ✅ Verify all schema errors are resolved
2. ✅ Test MFA setup flow (Settings → Security → Multi-Factor Authentication)
3. ✅ Test user profile editing (Settings → Profile)
4. ✅ Verify audit logs are recording PHI access properly
5. ✅ Test tenant isolation (ensure artlee users only see artlee data)

## Files Modified

### New Migration:
- `supabase/migrations/20251009000001_fix_artlee_schema.sql` (289 lines)

### Reference Documentation:
- `SCHEMA_FIX_GUIDE.md` (this file)

## Important Notes

🔒 **SYSTEM LOCKDOWN**: Per CLAUDE.md, all code is under comprehensive lockdown. This migration only adds missing database columns and tables - it does **NOT** modify any existing application code.

✅ **OWNER AUTHORIZATION**: This schema fix was requested by the system owner to resolve production errors.

⚡ **PRODUCTION READY**: This migration is safe to run in production. It uses `IF NOT EXISTS` checks and will not break existing data.

🔐 **TENANT ISOLATION**: All new columns and tables include `tenant_id` support to maintain complete data separation between ARTLEE, MedEx, and CareXPS.

---

**Last Updated**: 2025-10-09
**Author**: Claude Code (Anthropic)
**Status**: ✅ Ready to deploy
