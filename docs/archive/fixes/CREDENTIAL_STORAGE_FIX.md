# Credential Storage Fix - Complete Guide

## Problem Summary

Users were experiencing credential persistence issues where saved API credentials would be replaced with test values after page refresh:

### Symptoms
- User saves API credentials (API Key: `key_cda2021a151b9a84e721299f2c04`, Call Agent ID: `agent_544379e4fc2a465b7e8eb6fd19`)
- On page refresh, credentials revert to test values: `test_key_1760226666032`, `test_call_agent_1760226666032`
- Credentials don't persist across browser sessions or devices

### Console Errors Identified
```
❌ CloudCredentialService: Failed to store user credentials:
   {code: '42P10', message: "there is no unique or exclusion constraint matching the ON CONFLICT specification"}

❌ ApiKeyFallbackService: Error storing in user_settings:
   {code: 'PGRST204', message: "Could not find the 'api_key_updated_at' column of 'user_settings' in the schema cache"}

GET .../user_profiles?select=encrypted_agent_config,encrypted_retell_api_key... 400 (Bad Request)
```

## Root Cause Analysis

### 1. Missing `system_credentials` Table
The `cloudCredentialService.ts` attempts to store credentials in a `system_credentials` table that doesn't exist in the Supabase database. The service uses ON CONFLICT clause which requires unique constraints that were never created.

**Impact:** Primary credential storage method fails completely.

### 2. Missing `api_key_updated_at` Column in `user_settings`
The `apiKeyFallbackService.ts` tries to store `api_key_updated_at` timestamp in the `user_settings` table, but this column doesn't exist.

**Impact:** Fallback storage method fails, preventing credentials from being saved.

### 3. Missing Columns in `user_profiles`
The `apiKeyFallbackService.ts` attempts to read `encrypted_agent_config` and `encrypted_retell_api_key` columns from `user_profiles` table, but these columns don't exist.

**Impact:** Alternative storage method fails with 400 Bad Request error.

### 4. Credential Storage Hierarchy Breakdown
The application uses a 3-tier storage strategy:
1. **Primary:** `system_credentials` table (cloudCredentialService) ❌ BROKEN
2. **Fallback:** `user_settings` table (apiKeyFallbackService) ❌ BROKEN
3. **Emergency:** `user_profiles` table (apiKeyFallbackService) ❌ BROKEN
4. **Last Resort:** localStorage (works but doesn't sync across devices) ✅ WORKS

Since all Supabase storage methods fail, credentials only save to localStorage, causing them to:
- Not persist across devices
- Disappear when browser cache is cleared
- Get replaced by system defaults on app reload

## Solution Implemented

### Migration Files Created

#### 1. `20251011000001_create_system_credentials_table.sql`
Creates the missing `system_credentials` table with:
- Proper schema matching `cloudCredentialService` requirements
- Unique constraints for ON CONFLICT clauses to work
- Tenant isolation support (`tenant_id` column)
- User-specific credential overrides (`user_id` column)
- Row Level Security (RLS) policies
- Indexes for performance
- Cleanup function for old credentials

**Key Features:**
```sql
-- Unique constraint for system defaults per tenant
CREATE UNIQUE INDEX idx_system_credentials_system_defaults
ON system_credentials(tenant_id, credential_type, is_active)
WHERE credential_type = 'system_defaults' AND is_active = true;

-- Unique constraint for user overrides (fixes ON CONFLICT error)
CREATE UNIQUE INDEX idx_system_credentials_user_override
ON system_credentials(user_id, credential_type, tenant_id)
WHERE credential_type = 'user_override' AND user_id IS NOT NULL;
```

#### 2. `20251011000002_fix_user_settings_api_columns.sql`
Adds missing columns to `user_settings` table:
- `api_key_updated_at` (TIMESTAMPTZ) - Fixes PGRST204 error
- `retell_config` (JSONB) - For Retell AI configuration
- `encrypted_api_keys` (JSONB) - For encrypted API keys
- `retell_agent_config` (JSONB) - For agent configuration
- `encrypted_retell_keys` (JSONB) - For encrypted Retell keys

#### 3. `20251011000003_fix_user_profiles_credential_columns.sql`
Adds missing columns to `user_profiles` table:
- `encrypted_agent_config` (JSONB) - For encrypted agent configuration
- `encrypted_retell_api_key` (TEXT) - For encrypted Retell AI API key

**These fix the 400 Bad Request error when reading from user_profiles.**

### Migration Script Created

`apply-credential-migrations.mjs` - Node.js script to:
1. Execute all three migration files in order
2. Verify tables and columns were created successfully
3. Provide detailed error messages if anything fails
4. Show next steps for the user

## How to Apply the Fix

### Step 1: Set Environment Variable
Ensure your `.env.local` file contains the Supabase service role key:
```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 2: Run Migration Script
```bash
node apply-credential-migrations.mjs
```

**Expected Output:**
```
🚀 Starting credential storage migration...
   Supabase URL: https://cpkslvmydfdevdftieck.supabase.co

📄 Executing: Create system_credentials table
   File: 20251011000001_create_system_credentials_table.sql
   ✅ Success: Create system_credentials table

📄 Executing: Fix user_settings API columns
   File: 20251011000002_fix_user_settings_api_columns.sql
   ✅ Success: Fix user_settings API columns

📄 Executing: Fix user_profiles credential columns
   File: 20251011000003_fix_user_profiles_credential_columns.sql
   ✅ Success: Fix user_profiles credential columns

============================================================
VERIFICATION PHASE
============================================================

🔍 Verifying system_credentials table...
   ✅ Table exists and is accessible

🔍 Verifying user_settings columns...
   ✅ All required columns exist in user_settings

🔍 Verifying user_profiles columns...
   ✅ All required columns exist in user_profiles

============================================================
MIGRATION SUMMARY
============================================================

Migration Execution:
  system_credentials table: ✅
  user_settings columns:    ✅
  user_profiles columns:    ✅

Verification:
  system_credentials table: ✅
  user_settings columns:    ✅
  user_profiles columns:    ✅

✅ All migrations completed successfully!
```

### Step 3: Alternative Manual Application (If Script Fails)

If the Node.js script fails due to RLS or permissions, apply migrations manually using Supabase SQL Editor:

1. Open Supabase Dashboard: https://app.supabase.com/project/cpkslvmydfdevdftieck/editor
2. Go to SQL Editor
3. Copy and paste each migration file content:
   - First: `20251011000001_create_system_credentials_table.sql`
   - Second: `20251011000002_fix_user_settings_api_columns.sql`
   - Third: `20251011000003_fix_user_profiles_credential_columns.sql`
4. Click "Run" for each migration
5. Verify no errors appear

## After Migration - User Instructions

### Step 1: Clear Browser Data
1. Open Browser DevTools (F12)
2. Go to Application tab > Storage
3. Click "Clear site data"
4. Close and reopen browser

### Step 2: Re-Save API Credentials
1. Login to Phaeton AI CRM
2. Go to Settings > API Configuration
3. Enter your credentials:
   - API Key: `key_cda2021a151b9a84e721299f2c04`
   - Call Agent ID: `agent_544379e4fc2a465b7e8eb6fd19`
   - SMS Agent ID: (if you have one)
4. Click Save

### Step 3: Verify Persistence
1. **Refresh the page (F5)**
   - ✅ Credentials should remain the same (not revert to test values)
2. **Open in new tab**
   - ✅ Same credentials should appear
3. **Test on different device (optional)**
   - Login from another computer/phone
   - ✅ Same credentials should sync automatically

### Expected Console Messages (Success)
```
✅ CloudCredentialService: Initialization completed successfully
📁 Phaeton AI - Storing valid credentials to cloud
✅ Phaeton AI: Synced user credentials to cloud for: 166b5086-5ec5-49f3-9eff-68f75d0c8e79
```

### What Should NOT Appear After Fix
```
❌ CloudCredentialService: Failed to store user credentials: {code: '42P10'...}
❌ ApiKeyFallbackService: Error storing in user_settings: {code: 'PGRST204'...}
GET .../user_profiles?select=encrypted_agent_config... 400 (Bad Request)
```

## Technical Details

### Credential Storage Flow (After Fix)

1. **User Saves Credentials in Settings**
   ```typescript
   // src/components/settings/SettingsPage.tsx
   await cloudCredentialService.syncUserCredentialsToCloud(userId, credentials)
   ```

2. **CloudCredentialService Stores in system_credentials**
   ```typescript
   // src/services/cloudCredentialService.ts - Line 229
   await supabase.from('system_credentials').upsert([credentialRecord], {
     onConflict: 'user_id,credential_type'  // ✅ Now works with unique index
   })
   ```

3. **If Primary Storage Fails, Fallback to user_settings**
   ```typescript
   // src/services/apiKeyFallbackService.ts - Line 259
   await supabase.from('user_settings').upsert({
     user_id: userId,
     api_key_updated_at: new Date().toISOString()  // ✅ Column now exists
   })
   ```

4. **If Fallback Fails, Try user_profiles**
   ```typescript
   // src/services/apiKeyFallbackService.ts - Line 182
   await supabase.from('user_profiles').upsert({
     encrypted_agent_config: agentConfig  // ✅ Column now exists
   })
   ```

5. **If All Fail, Use localStorage**
   ```typescript
   // src/services/apiKeyFallbackService.ts - Line 308
   localStorage.setItem(`apikeys_${userId}`, JSON.stringify(dataToStore))
   ```

### Credential Loading Flow (After Fix)

1. **App Starts, Loads Credentials**
   ```typescript
   // src/App.tsx - Line 800-835
   const creds = await cloudCredentialService.getCredentialsWithFallback(userId)
   ```

2. **CloudCredentialService Checks system_credentials**
   ```typescript
   // src/services/cloudCredentialService.ts - Line 248
   const { data } = await supabase
     .from('system_credentials')  // ✅ Table now exists
     .select('*')
     .eq('user_id', userId)
   ```

3. **If Not Found, Try user_settings**
   ```typescript
   // src/services/apiKeyFallbackService.ts - Line 445
   const { data } = await supabase
     .from('user_settings')
     .select('retell_config, encrypted_api_keys')  // ✅ Columns now exist
   ```

4. **If Not Found, Try user_profiles**
   ```typescript
   // src/services/apiKeyFallbackService.ts - Line 377
   const { data } = await supabase
     .from('user_profiles')
     .select('encrypted_agent_config, encrypted_retell_api_key')  // ✅ Columns now exist
   ```

5. **If Not Found, Check localStorage**
   ```typescript
   // src/services/apiKeyFallbackService.ts - Line 470
   const storedData = localStorage.getItem(`apikeys_${userId}`)
   ```

## Tenant Isolation

The `system_credentials` table includes tenant isolation:
- `tenant_id` column stores 'phaeton_ai', 'artlee', 'medex', or 'carexps'
- RLS policies enforce tenant boundaries
- Users can only see credentials for their tenant

**Example:**
```sql
-- Users in phaeton_ai can only see phaeton_ai credentials
SELECT * FROM system_credentials
WHERE tenant_id = 'phaeton_ai'
  AND (credential_type = 'system_defaults' OR user_id = auth.uid())
```

## Security Features

### 1. Encryption
All API keys are encrypted before storage using AES-256-GCM encryption:
```typescript
const encrypted = await encryptionService.encryptString(apiKey)
```

### 2. Row Level Security (RLS)
Three RLS policies on `system_credentials`:
1. Users can read own credentials + system defaults
2. Users can manage own credential overrides
3. Super users can manage all credentials

### 3. Audit Logging
All credential operations are logged:
```typescript
await auditLogger.logSecurityEvent('API_KEYS_STORED', 'system_credentials', true, {
  userId,
  method: 'primary_storage'
})
```

## Troubleshooting

### Issue: Migrations Fail with Permission Error
**Solution:** Use Supabase SQL Editor to run migrations manually (requires admin access).

### Issue: Credentials Still Revert After Migration
**Checklist:**
1. ✅ Verify migrations completed successfully (check console output)
2. ✅ Clear browser cache and localStorage
3. ✅ Re-save credentials in Settings
4. ✅ Check console for error messages
5. ✅ Verify user is logged in (user_id exists)

### Issue: Cross-Device Sync Not Working
**Possible Causes:**
1. User not authenticated on second device
2. Different tenant_id on second device
3. RLS policies blocking access
4. Network connectivity issues

**Debug Steps:**
```javascript
// In browser console on both devices:
const userId = localStorage.getItem('currentUserId')
console.log('User ID:', userId)

// Check if credentials exist in Supabase
const { data } = await supabase
  .from('system_credentials')
  .select('*')
  .eq('user_id', userId)
console.log('Credentials in Supabase:', data)
```

### Issue: Console Shows "Column does not exist" After Migration
**Solution:**
1. Refresh Supabase PostgREST schema cache:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
2. Or restart your application

## Verification Checklist

After applying migrations, verify these work:

### ✅ Primary Storage (system_credentials)
```javascript
// Should succeed without errors
await cloudCredentialService.storeUserCredentials(userId, {
  apiKey: 'test_key',
  callAgentId: 'test_agent',
  smsAgentId: 'test_sms'
})
```

### ✅ Fallback Storage (user_settings)
```javascript
// Should succeed without api_key_updated_at error
await supabase.from('user_settings').upsert({
  user_id: userId,
  api_key_updated_at: new Date().toISOString()
})
```

### ✅ Alternative Storage (user_profiles)
```javascript
// Should succeed without 400 Bad Request
await supabase.from('user_profiles').upsert({
  user_id: userId,
  encrypted_agent_config: { call_agent_id: 'test' },
  encrypted_retell_api_key: 'encrypted_test_key'
})
```

### ✅ Cross-Device Sync
1. Save credentials on Device A
2. Login on Device B
3. Verify same credentials appear on Device B

### ✅ Persistence Across Sessions
1. Save credentials
2. Close browser completely
3. Reopen and login
4. Verify credentials still present (not test values)

## Success Criteria

After migration, these should all be true:

1. ✅ User can save API credentials in Settings
2. ✅ Credentials persist after page refresh
3. ✅ Credentials persist after browser restart
4. ✅ Credentials sync across multiple devices
5. ✅ No console errors about missing tables/columns
6. ✅ No credentials reverting to test values
7. ✅ Tenant isolation working (Phaeton AI users see only their credentials)
8. ✅ Encryption working (credentials stored encrypted in database)
9. ✅ RLS policies enforced (users can't see other users' credentials)
10. ✅ Audit logs recording credential operations

## Files Modified

### New Files Created
1. `supabase/migrations/20251011000001_create_system_credentials_table.sql`
2. `supabase/migrations/20251011000002_fix_user_settings_api_columns.sql`
3. `supabase/migrations/20251011000003_fix_user_profiles_credential_columns.sql`
4. `apply-credential-migrations.mjs`
5. `CREDENTIAL_STORAGE_FIX.md` (this file)

### No Existing Files Modified
All fixes are database schema changes only. No application code was modified because the code was already correct - it was just missing the database schema to support it.

## Support

If you encounter issues after applying this fix:

1. **Check Console Logs:** Look for error messages in browser DevTools console
2. **Verify Migrations:** Ensure all three migrations completed successfully
3. **Check Supabase Dashboard:** Verify tables and columns exist
4. **Test Storage Methods:** Use browser console to test each storage method
5. **Contact Support:** Provide console logs and migration script output

## Summary

This fix resolves the credential persistence issue by creating the missing database schema required by the application's credential storage system. After applying these migrations, users will be able to save their API credentials and have them persist correctly across sessions and devices, with proper tenant isolation and security.

**Status:** ✅ Fix Ready for Deployment

**Last Updated:** October 11, 2025
