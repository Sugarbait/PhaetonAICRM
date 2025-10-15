# 🚀 QUICK FIX CARD - Test Credentials Issue

## 🎯 Problem
Test credentials (`test_key_175979...`) keep loading even after entering real credentials.

## 🔧 Root Cause
Database missing 3 columns → Real credentials have nowhere to save → System falls back to test credentials.

---

## ✅ THE FIX (3 Steps)

### ⚡ STEP 1: Add Missing Database Columns (2 minutes)

**URL**: https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/sql/new

**Copy this SQL and click RUN:**
```sql
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS retell_api_key TEXT,
ADD COLUMN IF NOT EXISTS call_agent_id TEXT,
ADD COLUMN IF NOT EXISTS sms_agent_id TEXT;
```

**Success message**: "Migration successful: API credential columns added"

---

### 🧹 STEP 2: Clear Browser Cache (30 seconds)

**Open browser console (F12) and paste this:**
```javascript
Object.keys(sessionStorage).forEach(key => sessionStorage.removeItem(key));
Object.keys(localStorage).forEach(key => {
  if (key !== "supabase.auth.token") localStorage.removeItem(key);
});
setTimeout(() => window.location.reload(true), 1000);
```

---

### 🔑 STEP 3: Enter REAL Credentials (1 minute)

**Go to**: Settings → API Configuration

**Enter your REAL Retell AI credentials:**
- API Key: `key_xxxxxxxxxx` (NOT `test_key_`)
- Call Agent ID: `agent_xxxxxxxxxx` (NOT `test_`)
- SMS Agent ID: `agent_xxxxxxxxxx` (NOT `test_`)

**Click**: Save API Configuration

---

## ✅ Verification

**Console should show:**
```
✅ RetellService - Loaded API credentials from user_settings
✅ Credentials loading complete - pages can now render
```

**Dashboard/SMS/Calls should load with NO errors.**

---

## 🚨 If Still Not Working

1. Close ALL browser tabs
2. Open NEW incognito/private window
3. Login and check Settings again

**Still broken?** See COMPLETE-FIX-GUIDE.md for detailed troubleshooting.
