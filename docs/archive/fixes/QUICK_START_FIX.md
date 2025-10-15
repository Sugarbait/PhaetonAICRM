# Quick Start: Fix Credential Storage Issue

## Problem
Your API credentials revert to test values after page refresh.

## Cause
Database missing required tables, columns, and constraints.

## Solution (15 minutes)

### Step 1: Apply Database Migrations

**Open Supabase SQL Editor:**
https://app.supabase.com/project/cpkslvmydfdevdftieck/editor

**Run These 3 SQL Scripts:**

#### Migration 1: Fix system_credentials constraints
```bash
File: supabase/migrations/20251011000004_add_system_credentials_constraints.sql
```
Copy entire file content → Paste in SQL Editor → Click "Run"

#### Migration 2: Fix user_settings columns
```bash
File: supabase/migrations/20251011000002_fix_user_settings_api_columns.sql
```
Copy entire file content → Paste in SQL Editor → Click "Run"

#### Migration 3: Fix user_profiles columns
```bash
File: supabase/migrations/20251011000003_fix_user_profiles_credential_columns.sql
```
Copy entire file content → Paste in SQL Editor → Click "Run"

### Step 2: Verify Migrations

Run verification script:
```bash
node verify-database-schema.mjs
```

Expected output:
```
✅ All schema requirements are met!
```

### Step 3: Clear Browser & Re-Save Credentials

1. **Clear Browser Cache:**
   - Open DevTools (F12)
   - Application tab > Storage > "Clear site data"
   - Close browser completely

2. **Re-Save Your Credentials:**
   - Login to Phaeton AI CRM
   - Settings > API Configuration
   - API Key: `key_cda2021a151b9a84e721299f2c04`
   - Call Agent ID: `agent_544379e4fc2a465b7e8eb6fd19`
   - Click "Save Changes"

3. **Test:**
   - Refresh page (F5)
   - ✅ Credentials should stay the same (not revert to test values)

### Step 4: Monitor Console

**Success Messages:**
```
✅ CloudCredentialService: Initialization completed successfully
📁 Phaeton AI - Storing valid credentials to cloud
✅ Phaeton AI: Synced user credentials to cloud
```

**No More Errors:**
```
❌ code: '42P10' (fixed)
❌ code: 'PGRST204' (fixed)
❌ 400 Bad Request (fixed)
```

---

## What Was Fixed

1. ✅ Added unique constraints to `system_credentials` table
2. ✅ Added 5 columns to `user_settings` table
3. ✅ Added 1 column to `user_profiles` table

## Result

- ✅ Credentials persist across sessions
- ✅ Credentials sync across devices
- ✅ No more test values appearing
- ✅ Secure Supabase storage working

---

## Need Help?

**Full Documentation:**
- `CREDENTIAL_FIX_REPORT.md` - Complete technical details
- `CREDENTIAL_STORAGE_FIX.md` - In-depth explanation

**Verification Script:**
```bash
node verify-database-schema.mjs
```

**Console Debugging:**
```javascript
// Check if credentials are in Supabase
const { data } = await supabase
  .from('system_credentials')
  .select('*')
  .eq('user_id', '166b5086-5ec5-49f3-9eff-68f75d0c8e79')
console.log(data)
```

---

**Status:** ✅ Ready to Apply
**Time Required:** ~15 minutes
**Risk Level:** Low (only database schema changes, no code changes)
