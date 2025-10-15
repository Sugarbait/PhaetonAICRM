# QUICK FIX: Pierre's Wrong Credentials

## Problem
API Configuration showing login password instead of Retell AI credentials.

## 5-Minute Fix

### 1. Run Diagnostic (Supabase SQL Editor)
```bash
diagnose-pierre-credentials.sql
```

### 2. Run Fix (Supabase SQL Editor)
```bash
fix-pierre-credentials.sql
```

### 3. Clear Browser (Pierre's Computer)
Open DevTools (F12) → Application → Local Storage → Delete:
- `settings_166b5086-5ec5-49f3-9eff-68f75d0c8e79`
- `userCredentials_166b5086-5ec5-49f3-9eff-68f75d0c8e79`
- `currentUser`

### 4. Verify Fix (Supabase SQL Editor)
```bash
verify-pierre-credentials.sql
```

### 5. Test (Pierre's Computer)
1. Logout completely
2. Login again
3. Go to Settings → API Configuration
4. Should see:
   - ✅ API Key: `key_c••••••••2c04`
   - ✅ Call Agent ID: `agent_544379e4fc2a465b7e8eb6fd19`
   - ❌ NO password visible

## Expected Results

### Before Fix:
```
API Key: $Ineed1millie$_phaetonai  ❌ WRONG!
```

### After Fix:
```
API Key: key_cda2021a151b9a84e721299f2c04  ✅ CORRECT!
Call Agent ID: agent_544379e4fc2a465b7e8eb6fd19  ✅ CORRECT!
```

## Files Needed
1. `diagnose-pierre-credentials.sql` - Find problem
2. `fix-pierre-credentials.sql` - Fix database
3. `verify-pierre-credentials.sql` - Confirm success

## User Info
- Email: pierre@phaetonai.com
- User ID: 166b5086-5ec5-49f3-9eff-68f75d0c8e79
- Tenant: phaeton_ai

## Correct Credentials
- API Key: `key_cda2021a151b9a84e721299f2c04`
- Call Agent ID: `agent_544379e4fc2a465b7e8eb6fd19`
- SMS Agent ID: (blank/optional)
