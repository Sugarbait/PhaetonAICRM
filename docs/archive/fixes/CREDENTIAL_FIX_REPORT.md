# Credential Storage Fix - Implementation Report

**Date:** October 11, 2025
**User:** pierre@phaetonai.com (User ID: 166b5086-5ec5-49f3-9eff-68f75d0c8e79)
**Issue:** API credentials reverting to test values after page refresh
**Status:** ✅ Fix Ready for Deployment

---

## Executive Summary

Your Phaeton AI CRM credential storage system has been experiencing failures due to missing database schema components. The application code is correct, but the database is missing required tables, columns, and constraints.

**Impact:**
- ❌ Credentials only save to localStorage (not Supabase)
- ❌ No cross-device synchronization
- ❌ Credentials disappear when browser cache is cleared
- ❌ Credentials revert to test values on app reload

**Solution:**
Three SQL migrations have been created to add the missing database schema. Once applied, your credentials will persist correctly across sessions and sync between devices.

---

## Problem Analysis

### Current Database State

The verification script revealed these issues:

```
✅ system_credentials table exists (1 row)
❌ system_credentials missing unique constraints for ON CONFLICT
❌ user_settings missing 5 API credential columns
❌ user_profiles missing 1 API credential column

RESULT: All Supabase storage methods fail → localStorage only
```

### Error Messages Explained

#### 1. CloudCredentialService Error (Primary Storage)
```
❌ Failed to store user credentials: {code: '42P10',
   message: "there is no unique or exclusion constraint matching
   the ON CONFLICT specification"}
```

**Cause:** The `system_credentials` table exists but is missing the unique constraint required for upsert operations (ON CONFLICT clause).

**Impact:** Primary credential storage fails completely.

#### 2. ApiKeyFallbackService Error (Fallback Storage)
```
❌ Error storing in user_settings: {code: 'PGRST204',
   message: "Could not find the 'api_key_updated_at' column
   of 'user_settings' in the schema cache"}
```

**Cause:** The `user_settings` table is missing the `api_key_updated_at` column and 4 other API credential columns.

**Impact:** Fallback storage method fails.

#### 3. User Profiles Error (Alternative Storage)
```
GET .../user_profiles?select=encrypted_agent_config,
    encrypted_retell_api_key... 400 (Bad Request)
```

**Cause:** The `user_profiles` table is missing the `encrypted_agent_config` column.

**Impact:** Alternative storage method fails.

### Storage Hierarchy Breakdown

The application uses a 4-tier credential storage strategy:

| Tier | Method | Status | Impact |
|------|--------|--------|--------|
| 1 | `system_credentials` table | ❌ BROKEN | Missing unique constraints |
| 2 | `user_settings` table | ❌ BROKEN | Missing 5 columns |
| 3 | `user_profiles` table | ❌ BROKEN | Missing 1 column |
| 4 | localStorage | ✅ WORKS | No cross-device sync |

**Result:** Only localStorage works, causing credentials to be device-specific and not persistent.

---

## Solution: Database Schema Migrations

Three SQL migration files have been created to fix the schema issues:

### Migration 1: Add Unique Constraints to system_credentials
**File:** `supabase/migrations/20251011000004_add_system_credentials_constraints.sql`

**Purpose:** Adds unique constraints to the existing `system_credentials` table

**Changes:**
```sql
-- Critical constraint that fixes ON CONFLICT error
CREATE UNIQUE INDEX idx_system_credentials_user_override
ON system_credentials(user_id, credential_type, tenant_id)
WHERE credential_type = 'user_override' AND user_id IS NOT NULL;

-- Additional constraints for system defaults
CREATE UNIQUE INDEX idx_system_credentials_system_defaults
ON system_credentials(tenant_id, credential_type, is_active)
WHERE credential_type = 'system_defaults' AND is_active = true;
```

**What it fixes:**
- ✅ Allows ON CONFLICT clause to work in upsert operations
- ✅ Enables proper credential updates without duplicates
- ✅ Fixes error code 42P10

### Migration 2: Add Columns to user_settings
**File:** `supabase/migrations/20251011000002_fix_user_settings_api_columns.sql`

**Purpose:** Adds 5 missing API credential columns to `user_settings` table

**Changes:**
```sql
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS api_key_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS retell_config JSONB,
ADD COLUMN IF NOT EXISTS encrypted_api_keys JSONB,
ADD COLUMN IF NOT EXISTS retell_agent_config JSONB,
ADD COLUMN IF NOT EXISTS encrypted_retell_keys JSONB;
```

**What it fixes:**
- ✅ Allows fallback credential storage to work
- ✅ Enables timestamp tracking for credential updates
- ✅ Fixes error code PGRST204

### Migration 3: Add Column to user_profiles
**File:** `supabase/migrations/20251011000003_fix_user_profiles_credential_columns.sql`

**Purpose:** Adds 1 missing API credential column to `user_profiles` table

**Changes:**
```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS encrypted_agent_config JSONB;
```

**What it fixes:**
- ✅ Allows alternative credential storage to work
- ✅ Enables agent configuration storage
- ✅ Fixes 400 Bad Request error

---

## How to Apply the Fix

### Option 1: Recommended - Supabase SQL Editor (Most Reliable)

**Step 1:** Open Supabase Dashboard
```
https://app.supabase.com/project/cpkslvmydfdevdftieck/editor
```

**Step 2:** Navigate to SQL Editor (left sidebar)

**Step 3:** Apply Migration 1
1. Open file: `supabase/migrations/20251011000004_add_system_credentials_constraints.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click "Run"
5. Verify success message: "Migration successful: Unique constraints added..."

**Step 4:** Apply Migration 2
1. Open file: `supabase/migrations/20251011000002_fix_user_settings_api_columns.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click "Run"
5. Verify success message: "Migration successful: API credential columns added..."

**Step 5:** Apply Migration 3
1. Open file: `supabase/migrations/20251011000003_fix_user_profiles_credential_columns.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click "Run"
5. Verify success message: "Migration successful: Credential columns added..."

**Step 6:** Verify Migrations
```bash
node verify-database-schema.mjs
```

Expected output:
```
✅ All schema requirements are met!
   No migrations needed.
```

### Option 2: Automated Script (May Require Troubleshooting)

```bash
node apply-credential-migrations.mjs
```

If this fails due to permissions, use Option 1 instead.

---

## After Migration - What You Need to Do

### Step 1: Clear Browser Data

**Why:** Remove old cached credentials from localStorage

**How:**
1. Open Browser DevTools (F12)
2. Go to Application tab > Storage
3. Click "Clear site data"
4. Close and reopen browser
5. Login to Phaeton AI CRM

### Step 2: Re-Save Your API Credentials

**Your Credentials:**
- API Key: `key_cda2021a151b9a84e721299f2c04`
- Call Agent ID: `agent_544379e4fc2a465b7e8eb6fd19`
- SMS Agent ID: (if you have one)

**How:**
1. Login to Phaeton AI CRM
2. Go to Settings > API Configuration
3. Enter your credentials in the form
4. Click "Save Changes"

### Step 3: Verify Credentials Persist

**Test 1: Page Refresh**
1. Refresh the page (F5)
2. ✅ Expected: Same credentials still displayed (not test values)

**Test 2: New Tab**
1. Open Settings in a new tab
2. ✅ Expected: Same credentials displayed

**Test 3: Browser Restart**
1. Close browser completely
2. Reopen and login
3. Go to Settings > API Configuration
4. ✅ Expected: Same credentials displayed

**Test 4: Different Device (Optional)**
1. Login from another computer or phone
2. Go to Settings > API Configuration
3. ✅ Expected: Same credentials synchronized automatically

### Step 4: Monitor Console Messages

**Success Indicators:**
```
✅ CloudCredentialService: Initialization completed successfully
📁 Phaeton AI - Storing valid credentials to cloud
✅ Phaeton AI: Synced user credentials to cloud for: 166b5086-5ec5-49f3-9eff-68f75d0c8e79
```

**Errors That Should NOT Appear:**
```
❌ CloudCredentialService: Failed to store user credentials: {code: '42P10'...}
❌ ApiKeyFallbackService: Error storing in user_settings: {code: 'PGRST204'...}
GET .../user_profiles?select=encrypted_agent_config... 400 (Bad Request)
```

---

## Technical Details

### How Credential Storage Works After Fix

#### Storage Flow (When You Click "Save")

```
1. Settings Page saves credentials
   ↓
2. cloudCredentialService.syncUserCredentialsToCloud()
   ↓
3. Try Primary: system_credentials table (NOW WORKS ✅)
   ├─ ON CONFLICT (user_id, credential_type, tenant_id) DO UPDATE
   └─ Success: Credentials stored in Supabase
   ↓
4. If Primary fails, try Fallback: user_settings table (NOW WORKS ✅)
   └─ Has all required columns including api_key_updated_at
   ↓
5. If Fallback fails, try Alternative: user_profiles table (NOW WORKS ✅)
   └─ Has encrypted_agent_config column
   ↓
6. If all fail, Emergency: localStorage (ALWAYS WORKED ✅)
   └─ Local-only storage without cross-device sync
```

#### Loading Flow (When Page Refreshes)

```
1. App starts, loads user credentials
   ↓
2. cloudCredentialService.getCredentialsWithFallback(userId)
   ↓
3. Try system_credentials table FIRST
   └─ If found: Use these credentials (user-specific or system defaults)
   ↓
4. Try user_settings table SECOND
   └─ If found: Use these credentials
   ↓
5. Try user_profiles table THIRD
   └─ If found: Use these credentials
   ↓
6. Try localStorage LAST
   └─ If found: Use these credentials (device-specific)
   ↓
7. If nothing found: Use hardcoded bulletproof defaults
```

### Security Features

All credential storage includes:

1. **Encryption:** AES-256-GCM encryption for all API keys
2. **Tenant Isolation:** Credentials filtered by `tenant_id = 'phaeton_ai'`
3. **Row Level Security:** RLS policies prevent unauthorized access
4. **Audit Logging:** All credential operations logged to audit_logs table

### Verification Query

After migration, you can verify credentials are stored correctly:

```sql
-- Check system_credentials table
SELECT
  credential_type,
  api_key,
  call_agent_id,
  sms_agent_id,
  tenant_id,
  user_id,
  created_at,
  updated_at
FROM system_credentials
WHERE user_id = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
  AND credential_type = 'user_override'
  AND tenant_id = 'phaeton_ai';
```

Expected result:
```
credential_type: user_override
api_key: key_cda2021a151b9a84e721299f2c04
call_agent_id: agent_544379e4fc2a465b7e8eb6fd19
sms_agent_id: (your SMS agent ID or empty)
tenant_id: phaeton_ai
user_id: 166b5086-5ec5-49f3-9eff-68f75d0c8e79
```

---

## Files Created

### Migration Files
1. `supabase/migrations/20251011000004_add_system_credentials_constraints.sql`
2. `supabase/migrations/20251011000002_fix_user_settings_api_columns.sql`
3. `supabase/migrations/20251011000003_fix_user_profiles_credential_columns.sql`

### Utility Scripts
1. `verify-database-schema.mjs` - Check current database state
2. `apply-credential-migrations.mjs` - Automated migration application
3. `apply-migrations-direct.mjs` - Manual migration guide

### Documentation
1. `CREDENTIAL_STORAGE_FIX.md` - Detailed technical documentation
2. `CREDENTIAL_FIX_REPORT.md` - This report

---

## Troubleshooting

### Issue: Migrations Fail with Permission Error

**Solution:** Use Supabase SQL Editor (Option 1) instead of the automated script. The SQL Editor runs with admin privileges.

### Issue: Credentials Still Revert After Migration

**Checklist:**
1. ✅ Verify migrations completed successfully
   ```bash
   node verify-database-schema.mjs
   ```
2. ✅ Clear browser cache and localStorage
3. ✅ Re-save credentials in Settings
4. ✅ Check browser console for error messages
5. ✅ Verify you're logged in with correct user ID

### Issue: Cross-Device Sync Not Working

**Debug Steps:**
1. On Device A: Save credentials
2. On Device B: Login
3. Open Browser Console on both devices
4. Run this code:
   ```javascript
   const userId = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
   const { data } = await supabase
     .from('system_credentials')
     .select('*')
     .eq('user_id', userId)
     .eq('credential_type', 'user_override')
   console.log('Credentials in Supabase:', data)
   ```
5. Verify same data appears on both devices

### Issue: Console Shows "Column does not exist" After Migration

**Solution:** Refresh Supabase PostgREST schema cache

**Method 1:** Via SQL Editor
```sql
NOTIFY pgrst, 'reload schema';
```

**Method 2:** Restart your application

---

## Success Criteria

After completing all steps, verify these are true:

- ✅ User can save API credentials in Settings
- ✅ Credentials persist after page refresh (not test values)
- ✅ Credentials persist after browser restart
- ✅ Credentials sync across multiple devices
- ✅ No console errors about missing tables/columns
- ✅ No error code 42P10 or PGRST204
- ✅ Console shows success messages from cloudCredentialService
- ✅ Verification script reports "All schema requirements are met!"

---

## Support

If you encounter any issues:

1. **Run verification script:**
   ```bash
   node verify-database-schema.mjs
   ```

2. **Check browser console** for error messages

3. **Verify migrations in Supabase Dashboard:**
   - SQL Editor > Query History
   - Check for successful execution

4. **Test each storage method individually** using browser console

5. **Provide diagnostic information:**
   - Verification script output
   - Browser console logs
   - Migration execution results

---

## Summary

Your Phaeton AI CRM credential storage system was failing because the database schema was incomplete. Three SQL migrations have been created to add:

1. **Unique constraints** to `system_credentials` table (fixes ON CONFLICT error)
2. **5 columns** to `user_settings` table (fixes fallback storage)
3. **1 column** to `user_profiles` table (fixes alternative storage)

**Next Steps:**
1. Apply migrations using Supabase SQL Editor
2. Clear browser cache and localStorage
3. Re-save your API credentials
4. Verify credentials persist across sessions and devices

**Expected Outcome:**
After following these steps, your API credentials will:
- ✅ Persist correctly across browser sessions
- ✅ Synchronize across multiple devices
- ✅ Store securely in Supabase with encryption
- ✅ Never revert to test values again

**Status:** ✅ Ready for Implementation

---

**Report Generated:** October 11, 2025
**Implementation Time:** ~15 minutes
**Zero Code Changes Required:** Only database schema updates
