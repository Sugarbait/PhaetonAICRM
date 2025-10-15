# Pierre Credential Fix - Complete Instructions

## Problem Summary

**User:** pierre@phaetonai.com (user_id: 166b5086-5ec5-49f3-9eff-68f75d0c8e79)

**Issue:** Login password ($Ineed1millie$_phaetonai) is showing in the API Key field instead of the correct Retell API credentials.

**Root Cause:** Browser localStorage has wrong credentials, and EnhancedApiKeyManager only loads from localStorage (not from Supabase).

## Correct Credentials

```
API Key:        key_cda2021a151b9a84e721299f2c04
Call Agent ID:  agent_544379e4fc2a465b7e8eb6fd19
SMS Agent ID:   (empty)
Tenant ID:      phaeton_ai
```

---

## Solution Path 1: Browser-Based Fix (RECOMMENDED - Easiest)

### Step 1: Open the Fix Tool

1. Open the file `FIX_PIERRE_CREDENTIALS_BROWSER.html` in a web browser
2. The tool will automatically diagnose the current state

### Step 2: Follow the On-Screen Steps

The tool has 4 sections:

1. **Step 1: Diagnose** - Click "Check Current Credentials" to see what's wrong
2. **Step 2: Clear** - Click "Clear localStorage Credentials" to remove wrong data
3. **Step 3: Apply** - Click "Apply Correct Credentials" to set correct values
4. **Step 4: Verify** - Click "Verify Credentials Are Correct" then "Reload Page"

### Step 3: Verify in Application

After reload:
1. Go to Settings > API Configuration
2. You should see the correct credentials displayed
3. If they're still empty, click Save to persist them

**Expected Time:** 2-3 minutes

---

## Solution Path 2: Manual Browser Console Fix (Alternative)

### Step 1: Clear Wrong Credentials

1. Open your application (localhost:3001)
2. Press F12 to open DevTools
3. Go to Console tab
4. Paste and run this code:

```javascript
// Clear wrong credentials
localStorage.removeItem('settings_166b5086-5ec5-49f3-9eff-68f75d0c8e79')
console.log('✅ Cleared wrong credentials')
```

### Step 2: Apply Correct Credentials

Paste and run this code in the Console:

```javascript
// Apply correct credentials
const userId = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
const correctSettings = {
  retellApiKey: 'key_cda2021a151b9a84e721299f2c04',
  callAgentId: 'agent_544379e4fc2a465b7e8eb6fd19',
  smsAgentId: '',
  tenantId: 'phaeton_ai'
}

// Get existing settings or create new
let settings = {}
const existing = localStorage.getItem(`settings_${userId}`)
if (existing) {
  try { settings = JSON.parse(existing) } catch(e) {}
}

// Merge with correct credentials
settings.retellApiKey = correctSettings.retellApiKey
settings.callAgentId = correctSettings.callAgentId
settings.smsAgentId = correctSettings.smsAgentId
settings.tenantId = correctSettings.tenantId

// Save
localStorage.setItem(`settings_${userId}`, JSON.stringify(settings))

console.log('✅ Applied correct credentials:', settings)
```

### Step 3: Reload Page

```javascript
location.reload()
```

### Step 4: Verify

1. Go to Settings > API Configuration
2. Verify correct credentials are shown
3. Test Calls and SMS pages

**Expected Time:** 3-5 minutes

---

## Solution Path 3: Supabase + Manual Entry (Most Thorough)

### Step 1: Fix Supabase Database

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/sql
2. Open the file `FINAL_PIERRE_CREDENTIAL_FIX.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click Run
6. Review the output to verify credentials were inserted

**Expected Output:**
```
✅✅✅ ALL CREDENTIALS CORRECT! ✅✅✅
```

### Step 2: Clear Browser localStorage

1. Open application (localhost:3001)
2. Press F12 → Application tab → Local Storage
3. Find key: `settings_166b5086-5ec5-49f3-9eff-68f75d0c8e79`
4. Right-click → Delete
5. Or click "Clear All" to clear everything

### Step 3: Hard Refresh

1. Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or close browser tab and reopen application

### Step 4: Manual Entry

1. Login to application
2. Go to Settings > API Configuration
3. Manually enter:
   - **API Key:** `key_cda2021a151b9a84e721299f2c04`
   - **Call Agent ID:** `agent_544379e4fc2a465b7e8eb6fd19`
   - **SMS Agent ID:** (leave empty)
4. Click "Save API Keys"
5. Wait for success message

### Step 5: Verify

1. Reload the page (F5)
2. Go back to Settings > API Configuration
3. Verify credentials still show correctly
4. Go to Calls page - should load calls
5. Go to SMS page - should show "No SMS Agent ID configured" (correct, since SMS Agent ID is empty)

**Expected Time:** 5-10 minutes

---

## Why This Keeps Happening

### The Issue

The `EnhancedApiKeyManager` component (Settings > API Configuration page) has this loading pattern:

```typescript
// Lines 96-119 of EnhancedApiKeyManager.tsx
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}')

const loadedApiKeys = {
  retell_api_key: settings.retellApiKey || '',
  call_agent_id: settings.callAgentId || '',
  sms_agent_id: settings.smsAgentId || ''
}
```

**Key Points:**
1. ✅ **Loads from localStorage ONLY** (no Supabase fallback)
2. ✅ **Saves to both localStorage AND Supabase** (via handleSave)
3. ❌ **No fallback if localStorage has wrong data**
4. ❌ **No validation that localStorage data is correct**

### Why localStorage Has Wrong Data

Someone or something wrote Pierre's login password into the localStorage settings:

```javascript
// Wrong data in localStorage:
settings_166b5086-5ec5-49f3-9eff-68f75d0c8e79 = {
  retellApiKey: "$Ineed1millie$_phaetonai"  // ❌ This is the LOGIN PASSWORD!
  // ... other wrong data
}
```

This could have happened from:
- A bug in credential initialization code
- Manual testing/debugging that went wrong
- Copy/paste error during manual credential entry
- Another service accidentally writing to the wrong localStorage key

### The Fix Flow

```
┌─────────────────┐
│  localStorage   │ ← ❌ Has wrong data (password in API key field)
└─────────────────┘
         ↓
┌─────────────────┐
│ EnhancedAPI     │ ← Loads from localStorage (gets wrong data)
│ KeyManager      │
└─────────────────┘
         ↓
┌─────────────────┐
│  UI Display     │ ← Shows password in API key field
└─────────────────┘

SOLUTION: Clear localStorage → Apply correct credentials → Reload
```

---

## Verification Checklist

After applying the fix, verify ALL of these:

### ✅ localStorage Check
```javascript
// Run in browser console:
const userId = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
const settings = JSON.parse(localStorage.getItem(`settings_${userId}`) || '{}')
console.log('API Key:', settings.retellApiKey)
console.log('Call Agent ID:', settings.callAgentId)

// Expected output:
// API Key: key_cda2021a151b9a84e721299f2c04
// Call Agent ID: agent_544379e4fc2a465b7e8eb6fd19
```

### ✅ UI Check
1. Go to Settings > API Configuration
2. API Key field should show: `key_c...` (masked)
3. Call Agent ID field should show: `agent_544379e4fc2a465b7e8eb6fd19`
4. Status should show: "API Key: Configured ✅" and "Call Agent: Configured ✅"

### ✅ Functional Check
1. Go to Calls page
2. Should load calls (if any exist)
3. Should NOT show "No API key configured" error
4. Go to SMS page
5. Should show "No SMS Agent ID configured" (correct - SMS Agent ID is empty)

### ✅ No Password in Fields
1. API Key field should NOT contain `$Ineed1millie$_phaetonai`
2. Call Agent ID field should NOT contain password
3. SMS Agent ID field should be empty

---

## If Fix Doesn't Work

### Scenario 1: Credentials Still Show Wrong After Fix

**Possible Causes:**
- Browser cache not cleared
- localStorage not actually updated
- Using wrong browser/profile

**Solution:**
1. Close ALL browser windows
2. Reopen browser
3. Go directly to Settings > API Configuration
4. If still wrong, run Solution Path 1 or 2 again

### Scenario 2: Credentials Empty After Fix

**Possible Causes:**
- localStorage cleared but not repopulated
- Supabase doesn't have correct data

**Solution:**
1. Run Solution Path 3 (Supabase + Manual Entry)
2. This ensures both Supabase AND localStorage have correct data

### Scenario 3: Save Button Doesn't Work

**Possible Causes:**
- Validation errors
- Supabase connection issues

**Solution:**
1. Check browser console for errors
2. Verify API key doesn't have extra spaces
3. Try trimming values:
   ```javascript
   // In console:
   const apiKey = 'key_cda2021a151b9a84e721299f2c04'
   console.log('Length:', apiKey.length) // Should be 36
   console.log('Trimmed:', apiKey.trim())
   ```

### Scenario 4: Credentials Revert After Reload

**Possible Causes:**
- Something is resetting localStorage on page load
- Supabase has different data

**Solution:**
1. Run FINAL_PIERRE_CREDENTIAL_FIX.sql to fix Supabase
2. Clear localStorage completely
3. Hard refresh (Ctrl+Shift+R)
4. Manually enter credentials again
5. Check console logs for any "loading credentials" messages that might be overwriting

---

## Understanding the System

### Credential Loading Priority (Current State)

```
Priority 1: localStorage
   ↓ (if exists)
   Load from localStorage.getItem('settings_{userId}')

Priority 2: (NONE - no fallback!)
   ↓ (if localStorage empty)
   Show blank form
```

### Credential Saving Flow

```
When user clicks "Save" in API Configuration:
   ↓
1. Validate inputs
   ↓
2. Save to localStorage (IMMEDIATE)
   ↓
3. Update retellService (IMMEDIATE)
   ↓
4. Try to save to Supabase (SECONDARY - can fail)
   ↓
5. Show success message
```

### Why Supabase Fix Alone Doesn't Help

Even if Supabase has correct credentials:
- EnhancedApiKeyManager doesn't load from Supabase
- It only loads from localStorage
- So fixing Supabase alone won't fix the UI

That's why we need BOTH:
1. Fix Supabase (source of truth)
2. Fix localStorage (what UI actually uses)

---

## Files Created

1. **FINAL_PIERRE_CREDENTIAL_FIX.sql** - Supabase database fix script
2. **FIX_PIERRE_CREDENTIALS_BROWSER.html** - Interactive browser-based fix tool
3. **DIAGNOSE_WHY_EMPTY_LOAD.md** - Technical analysis of root cause
4. **PIERRE_CREDENTIAL_FIX_INSTRUCTIONS.md** - This file (complete instructions)

---

## Support Contact

If the fix doesn't work after trying all 3 solution paths:

1. Take screenshots of:
   - Browser console (F12 > Console tab)
   - localStorage contents (F12 > Application > Local Storage)
   - API Configuration page showing wrong credentials
   - Supabase SQL Editor output from running FINAL_PIERRE_CREDENTIAL_FIX.sql

2. Note which solution paths you tried

3. Provide any error messages from console

This will help diagnose any additional issues.

---

## Quick Reference Commands

### Check localStorage (Console)
```javascript
const userId = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
console.log(JSON.parse(localStorage.getItem(`settings_${userId}`) || '{}'))
```

### Clear localStorage (Console)
```javascript
localStorage.removeItem('settings_166b5086-5ec5-49f3-9eff-68f75d0c8e79')
```

### Fix localStorage (Console)
```javascript
const userId = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
const settings = JSON.parse(localStorage.getItem(`settings_${userId}`) || '{}')
settings.retellApiKey = 'key_cda2021a151b9a84e721299f2c04'
settings.callAgentId = 'agent_544379e4fc2a465b7e8eb6fd19'
settings.smsAgentId = ''
settings.tenantId = 'phaeton_ai'
localStorage.setItem(`settings_${userId}`, JSON.stringify(settings))
location.reload()
```

---

**Last Updated:** 2025-10-11
**Status:** Ready for user to execute
**Recommended Path:** Solution Path 1 (Browser-Based Fix Tool)
