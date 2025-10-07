# 🔧 COMPLETE FIX GUIDE: Test Credentials Keep Loading

## ❌ The Problem

You're seeing test credentials like `test_key_175979...` and `test_call_agent_1759793128600` keep loading even after entering real credentials and clearing cache.

## 🔍 Root Cause (Two-Part Problem)

### Problem 1: Database Schema Missing Columns
Your `user_settings` table is **missing the columns** needed to save API credentials:
- ❌ Missing: `retell_api_key`
- ❌ Missing: `call_agent_id`
- ❌ Missing: `sms_agent_id`

**Result**: When you enter real credentials in Settings, they have nowhere to save permanently.

### Problem 2: Test Credentials Stuck in Browser Cache
Old test credentials are cached in `sessionStorage` and keep loading even after you clear them.

**Result**: The system falls back to test credentials because real ones can't be saved.

---

## ✅ THE COMPLETE FIX (2 Steps)

### STEP 1: Apply Database Migration (REQUIRED FIRST)

**This adds the missing columns to your database so real credentials can save.**

#### 1.1 Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/sql/new

#### 1.2 Copy This Exact SQL
```sql
-- Migration: Add API credential columns to user_settings table
-- Date: 2025-10-06
-- Purpose: Add individual API credential columns for Retell AI integration

-- Add API credential columns to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS retell_api_key TEXT,
ADD COLUMN IF NOT EXISTS call_agent_id TEXT,
ADD COLUMN IF NOT EXISTS sms_agent_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN user_settings.retell_api_key IS 'Retell AI API key for user-specific integration';
COMMENT ON COLUMN user_settings.call_agent_id IS 'Retell AI Call Agent ID for voice call management';
COMMENT ON COLUMN user_settings.sms_agent_id IS 'Retell AI SMS Agent ID for SMS/chat management';

-- Create index for faster lookups by user_id (if not already exists)
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Verify columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_settings'
    AND column_name IN ('retell_api_key', 'call_agent_id', 'sms_agent_id')
  ) THEN
    RAISE NOTICE 'Migration successful: API credential columns added to user_settings table';
  ELSE
    RAISE EXCEPTION 'Migration failed: API credential columns not found in user_settings table';
  END IF;
END $$;
```

#### 1.3 Run the Migration
1. Paste the SQL into the Supabase SQL Editor
2. Click **"Run"** button (bottom right)
3. Wait for success message: **"Migration successful: API credential columns added to user_settings table"**

#### 1.4 Verify Migration Worked
Run this in the same SQL Editor:
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'user_settings'
AND column_name IN ('retell_api_key', 'call_agent_id', 'sms_agent_id');
```

**Expected Output:**
```
retell_api_key
call_agent_id
sms_agent_id
```

✅ **If you see all 3 columns, migration successful!**

---

### STEP 2: Clear Browser Cache Aggressively

**Now that the database can save credentials, clear the old test credentials from your browser.**

#### 2.1 Open Browser Console
1. Go to http://localhost:9020
2. Press **F12** to open Developer Tools
3. Click **Console** tab

#### 2.2 Copy and Paste This Code (ALL AT ONCE)
```javascript
// 1. AGGRESSIVE SESSIONSTORAGE CLEAR
Object.keys(sessionStorage).forEach(key => {
  sessionStorage.removeItem(key);
  console.log("Cleared sessionStorage:", key);
});
console.log("✅ All sessionStorage cleared");

// 2. AGGRESSIVE LOCALSTORAGE CLEAR (keeps auth only)
const keysToKeep = ["supabase.auth.token"];
Object.keys(localStorage).forEach(key => {
  if (!keysToKeep.includes(key)) {
    localStorage.removeItem(key);
    console.log("Cleared localStorage:", key);
  }
});
console.log("✅ All localStorage cleared (except auth)");

// 3. HARD RELOAD
setTimeout(() => {
  window.location.href = window.location.origin;
  window.location.reload(true);
}, 1000);
```

#### 2.3 Press Enter
The page will automatically reload after 1 second.

---

### STEP 3: Enter Your REAL Credentials

#### 3.1 Navigate to Settings
After the page reloads, go to: **Settings → API Configuration**

#### 3.2 Enter Your REAL Retell AI Credentials
- **Retell AI API Key**: `key_xxxxxxxxxxxxxxxxxxxxxxx` (should start with `key_`, NOT `test_key_`)
- **Call Agent ID**: `agent_xxxxxxxxxxxxxxxxxxxxxxx` (should start with `agent_`, NOT `test_`)
- **SMS Agent ID**: `agent_xxxxxxxxxxxxxxxxxxxxxxx` (should start with `agent_`, NOT `test_`)

#### 3.3 Click "Save API Configuration"

#### 3.4 Verify Credentials Saved
**Check browser console (F12) for these logs:**
```
✅ API configuration saved successfully
✅ Credentials loading complete - pages can now render
```

**NO MORE TEST CREDENTIALS!**

---

## 🎯 Expected Results After Fix

### ✅ Before Login
- Loading screen shows: "Loading configuration..."
- Credentials load from Supabase database

### ✅ After Login
- Dashboard loads immediately
- SMS page loads immediately
- Calls page loads immediately
- **NO "Chat API endpoint not found" ERROR**

### ✅ Browser Console Logs (What You SHOULD See)
```
🔧 App - Initializing bulletproof API system...
🚀 Production Mode - Initializing Retell AI services
🔄 RetellService - Loading credentials with bulletproof persistence...
✅ RetellService - Loaded API credentials from user_settings
🔑 RetellService - Using API key: key_c3f0...f7f7 (length: 32)
✅ ChatService synced with RetellService on app initialization
✅ Credentials loading complete - pages can now render
```

### ❌ What You Should NOT See Anymore
```
❌ test_key_175979... (NO MORE!)
❌ test_call_agent_1759793128600 (NO MORE!)
❌ 🎯 RetellService - Found credentials in sessionStorage backup (NO MORE!)
❌ Chat API endpoint not found (NO MORE!)
```

---

## 🚨 Troubleshooting

### Issue: Migration says "column already exists"
**Solution**: That's fine! The migration uses `ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times.

### Issue: Still seeing test credentials after Step 2
**Solution**:
1. Close ALL browser tabs/windows for localhost:9020
2. Open a NEW incognito/private window
3. Go to http://localhost:9020
4. Login and check Settings → API Configuration

### Issue: "Chat API endpoint not found" still appears
**Possible Causes**:
1. **Migration not applied** - Go back to Step 1
2. **Real credentials not entered** - Check Settings → API Configuration
3. **Invalid Retell AI credentials** - Verify your API key and Agent IDs are correct in Retell AI dashboard

### Issue: Credentials don't save
**Check console for errors**:
- Look for: `❌ Error saving user settings`
- If you see this, the migration likely didn't apply correctly
- Re-run Step 1

---

## 📊 How to Verify Everything is Working

### Test 1: Logout and Login
1. Logout completely
2. Login again
3. Check Dashboard - should load immediately with no errors

### Test 2: Cross-Device Sync
1. Open http://localhost:9020 in Chrome
2. Login and verify credentials in Settings
3. Open http://localhost:9020 in Firefox (private window)
4. Login with same user
5. Check Settings → API Configuration - credentials should be there

### Test 3: Console Verification
After login, check browser console (F12) for:
```
✅ RetellService - Loaded API credentials from user_settings
✅ Credentials loading complete - pages can now render
```

**If you see these, everything is working!**

---

## 🎓 Why This Happened

**Original Design**: MedEx and CareXPS CRMs have the correct database schema with `retell_api_key`, `call_agent_id`, and `sms_agent_id` columns.

**ARTLEE Issue**: When ARTLEE was cloned, the database migration to add these columns was never applied, so the table was incomplete.

**Why Test Credentials Appeared**: The app generates test credentials as a fallback when no real credentials are found. Since real credentials couldn't be saved (missing columns), it kept falling back to test credentials.

**The Fix**: Apply the migration to match MedEx/CareXPS schema, then clear cache and enter real credentials.

---

## 📝 Summary Checklist

- [ ] **Step 1**: Applied database migration in Supabase SQL Editor
- [ ] **Verified**: Ran verification query, saw all 3 column names
- [ ] **Step 2**: Cleared browser cache with console commands
- [ ] **Step 3**: Entered REAL Retell AI credentials in Settings
- [ ] **Verified**: Saw success message in console
- [ ] **Test**: Logged out and back in - credentials still there
- [ ] **Test**: Dashboard/SMS/Calls pages load with no errors

**If all boxes checked: ✅ YOU'RE DONE!**

---

**Questions?** Check the console logs (F12) - they show exactly what's happening at each step.
