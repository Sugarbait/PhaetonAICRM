# URGENT: Pierre Credential Fix Guide

## Problem Summary
User Pierre (pierre@phaetonai.com, ID: 166b5086-5ec5-49f3-9eff-68f75d0c8e79) is seeing **login password** (`$Ineed1millie$_phaetonai`) instead of **Retell AI API key** when loading API configuration.

## Root Cause Analysis

### Expected Credentials:
- **API Key**: `key_cda2021a151b9a84e721299f2c04`
- **Call Agent ID**: `agent_544379e4fc2a465b7e8eb6fd19`
- **SMS Agent ID**: (optional)

### What's Actually Loading:
- Shows: `$Ineed1millie$_phaetonai` (this is the LOGIN PASSWORD!)
- This indicates credentials are stored in wrong database columns or mixed up

### Where Credentials Should Be Stored:
1. **localStorage**: `settings_166b5086-5ec5-49f3-9eff-68f75d0c8e79` with keys:
   - `retellApiKey`
   - `callAgentId`
   - `smsAgentId`

2. **Supabase user_settings table**: Columns:
   - `retell_api_key`
   - `call_agent_id`
   - `sms_agent_id`

3. **Supabase system_credentials table**: For cloud sync (optional but recommended)

### Why Login Password is Appearing:
Most likely scenarios:
1. **Wrong localStorage key**: Password stored under `retellApiKey` instead of proper location
2. **Database column mix-up**: Password stored in `retell_api_key` column in user_settings
3. **Encryption issue**: Encrypted password being decrypted and displayed as API key
4. **Service logic bug**: UserManagementService storing password in wrong field

---

## Step-by-Step Fix Procedure

### STEP 1: Run Diagnostic Script

**Open Supabase SQL Editor** and run:
```bash
I:\Apps Back Up\Phaeton AI CRM\diagnose-pierre-credentials.sql
```

**What This Does:**
- Checks all 3 tables (user_settings, user_profiles, system_credentials)
- Looks for the problematic password value
- Shows what's currently stored for Pierre
- Identifies where the mix-up occurred

**Expected Output:**
- Will show which table has the password in credential fields
- Will show if correct credentials exist anywhere
- Will reveal the exact location of the problem

---

### STEP 2: Clear Browser Storage (Pierre's Computer)

**Instructions for Pierre:**
1. Open browser DevTools (F12)
2. Go to **Application** tab → **Local Storage**
3. Find and DELETE this key:
   ```
   settings_166b5086-5ec5-49f3-9eff-68f75d0c8e79
   ```
4. Also clear:
   ```
   userCredentials_166b5086-5ec5-49f3-9eff-68f75d0c8e79
   currentUser
   ```
5. Close DevTools
6. **DO NOT RELOAD PAGE YET**

---

### STEP 3: Run Fix Script in Supabase

**Open Supabase SQL Editor** and run:
```bash
I:\Apps Back Up\Phaeton AI CRM\fix-pierre-credentials.sql
```

**What This Does:**
1. ✅ Clears ALL incorrect credential data from user_settings
2. ✅ Clears ALL incorrect credential data from user_profiles
3. ✅ Inserts CORRECT credentials into user_settings:
   - `retell_api_key = 'key_cda2021a151b9a84e721299f2c04'`
   - `call_agent_id = 'agent_544379e4fc2a465b7e8eb6fd19'`
   - `sms_agent_id = NULL`
4. ✅ Inserts CORRECT credentials into system_credentials (cloud sync)
5. ✅ Verifies the fix by querying both tables

**Expected Result:**
```sql
-- VERIFICATION OUTPUT:
check_name: VERIFICATION: user_settings
user_id: 166b5086-5ec5-49f3-9eff-68f75d0c8e79
retell_api_key: key_cda2021a151b9a84e721299f2c04
call_agent_id: agent_544379e4fc2a465b7e8eb6fd19
sms_agent_id: NULL

check_name: VERIFICATION: system_credentials
credential_type: user_override
user_id: 166b5086-5ec5-49f3-9eff-68f75d0c8e79
api_key: key_cda2021a151b9a84e721299f2c04
call_agent_id: agent_544379e4fc2a465b7e8eb6fd19
sms_agent_id: NULL
tenant_id: phaeton_ai
is_active: true
```

---

### STEP 4: Test the Fix (Pierre's Computer)

**Instructions for Pierre:**
1. **Logout** of the application completely
2. **Close browser** completely
3. **Reopen browser** and go to the CRM
4. **Login** with correct credentials:
   - Email: `pierre@phaetonai.com`
   - Password: `$Ineed1millie$_phaetonai`
5. Go to **Settings** → **API Configuration**
6. **Verify** the correct values load:
   - ✅ API Key field shows: `key_c••••••••2c04` (masked)
   - ✅ Call Agent ID shows: `agent_544379e4fc2a465b7e8eb6fd19`
   - ✅ SMS Agent ID shows: (blank or whatever you set)

**Console Verification:**
Open DevTools Console (F12) and look for:
```
🔧 API Key Manager: Loading credentials from current user settings ONLY
✅ API Key Manager: Loaded credentials from current user settings:
  hasApiKey: true
  apiKeyLength: 32
  apiKeyPrefix: 'key_cda2021a15...'
  callAgentId: 'agent_544379e4fc2a465b7e8eb6fd19'
  smsAgentId: 'EMPTY'
```

**If you see:**
```
apiKeyPrefix: '$Ineed1millie$...'  ❌ STILL BROKEN
```

Then localStorage was NOT cleared properly. Repeat Step 2.

---

### STEP 5: Verify API Connection Works

**In Settings → API Configuration:**
1. Click **"Test Connection"** button
2. Should see:
   ```
   ✅ Connection Test Passed
   API connection successful! Your credentials are working correctly.
   ```

**If test fails:**
- Check that API key is correct in Retell AI dashboard
- Verify API key has proper permissions
- Check network connectivity

---

## Additional Verification Queries

### Check if password is stored in wrong places:
```sql
-- Search for password in user_settings
SELECT
  user_id,
  retell_api_key,
  call_agent_id,
  sms_agent_id
FROM user_settings
WHERE retell_api_key LIKE '%$Ineed1millie$%'
   OR call_agent_id LIKE '%$Ineed1millie$%'
   OR sms_agent_id LIKE '%$Ineed1millie$%';

-- Search for password in system_credentials
SELECT
  user_id,
  credential_type,
  api_key,
  call_agent_id,
  sms_agent_id,
  tenant_id
FROM system_credentials
WHERE api_key LIKE '%$Ineed1millie$%'
   OR call_agent_id LIKE '%$Ineed1millie$%'
   OR sms_agent_id LIKE '%$Ineed1millie$%';
```

If these queries return ANY rows, there's data corruption that needs cleaning.

---

## Why This Happened

### Likely Root Cause:
The `EnhancedApiKeyManager` component (lines 112-118) loads credentials from localStorage using this pattern:

```typescript
const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}')

const loadedApiKeys = {
  retell_api_key: settings.retellApiKey || '',
  call_agent_id: settings.callAgentId || '',
  sms_agent_id: settings.smsAgentId || ''
}
```

**Problem Scenarios:**
1. **Scenario A**: User registration stored password in `settings.retellApiKey` by mistake
2. **Scenario B**: Credential initialization service mixed up password and API key fields
3. **Scenario C**: Encrypted password was decrypted and stored as API key
4. **Scenario D**: Database migration copied password into wrong column

### Prevention Going Forward:
1. ✅ Never store passwords in `user_settings` table
2. ✅ Add validation in `EnhancedApiKeyManager` to reject values that look like passwords
3. ✅ Add validation in credential services to reject password-like strings
4. ✅ Use proper encryption service for sensitive data
5. ✅ Implement schema validation before storing credentials

---

## Success Criteria

After fix is complete, Pierre should see:
- ✅ API Key: `key_cda2021a151b9a84e721299f2c04` (or masked version)
- ✅ Call Agent ID: `agent_544379e4fc2a465b7e8eb6fd19`
- ✅ SMS Agent ID: (blank or configured value)
- ❌ NO login password (`$Ineed1millie$_phaetonai`) anywhere in API config

Console logs should show:
```
🔧 API Key Manager: Loading credentials from current user settings ONLY
✅ API Key Manager: Loaded credentials from current user settings:
  hasApiKey: true
  apiKeyLength: 32
  apiKeyPrefix: 'key_cda2021a15...'
  callAgentId: 'agent_544379e4fc2a465b7e8eb6fd19'
```

---

## Emergency Contact

If fix doesn't work after following all steps:
1. Check browser console for errors
2. Verify Supabase queries ran successfully (no errors in SQL Editor)
3. Confirm localStorage was completely cleared
4. Try incognito/private browsing mode to test fresh session
5. Check if other users have same issue (system-wide vs user-specific)

---

## Files Created for This Fix

1. **diagnose-pierre-credentials.sql** - Diagnostic queries to identify problem
2. **fix-pierre-credentials.sql** - Fix script to correct database
3. **PIERRE_CREDENTIAL_FIX_GUIDE.md** - This comprehensive guide

---

**Date**: 2025-10-11
**Issue**: Wrong credentials loading (password instead of API key)
**User Affected**: pierre@phaetonai.com
**Severity**: CRITICAL - User cannot use application
**Status**: Fix prepared, awaiting execution
