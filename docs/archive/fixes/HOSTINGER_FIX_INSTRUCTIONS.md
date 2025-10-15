# 🔧 Hostinger Error Fix - Failed Login Attempts Table

**Issue:** `GET failed_login_attempts 400 (Bad Request)`

**Cause:** Table exists but has **wrong column names** (schema mismatch)

**Current Schema:**
- ✅ `email`
- ✅ `ip_address`
- ⚠️ `attempt_time` (should be `attempted_at`)
- ❌ Missing: `user_agent`, `reason`

**Impact:** MFA lockout protection disabled (non-blocking, app still works)

---

## ✅ Solution: Fix the Table Schema in Supabase

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: `cpkslvmydfdevdftieck`
3. Navigate to: **SQL Editor** (left sidebar)

### Step 2: Create New Query

1. Click **"New Query"** button
2. Copy the entire SQL migration from:
   ```
   supabase/migrations/20251010000006_fix_failed_login_attempts_schema.sql
   ```

### Step 3: Execute Migration

1. Paste the SQL into the editor
2. Click **"Run"** button (or press `Ctrl+Enter`)
3. Wait for success message

### Step 4: Verify Schema Fix

Run this verification query:
```sql
-- Test insert with all required fields
INSERT INTO failed_login_attempts (email, ip_address, user_agent, reason, attempted_at)
VALUES ('test@example.com', '127.0.0.1', 'Test Agent', 'Schema test', NOW());

-- Verify insert worked
SELECT * FROM failed_login_attempts WHERE email = 'test@example.com';

-- Clean up test record
DELETE FROM failed_login_attempts WHERE email = 'test@example.com';
```

Expected result: Insert and select work without errors

---

## 📋 What This Table Does:

The `failed_login_attempts` table provides:

- ✅ **Brute-force protection** - Tracks failed login attempts
- ✅ **MFA lockout** - Automatically locks accounts after multiple failed attempts
- ✅ **Security monitoring** - Logs IP addresses and user agents
- ✅ **Auto-cleanup** - Removes attempts older than 30 days

---

## 🔐 Table Schema:

```sql
CREATE TABLE failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  reason TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🚀 After Migration:

1. **Refresh Hostinger site** - The error will disappear
2. **MFA lockout active** - Accounts lock after 5 failed attempts (15 min lockout)
3. **Security enhanced** - Full brute-force protection enabled

---

## ⚠️ Alternative: Quickfix SQL (If Full Migration Fails)

If the full migration doesn't work, run this minimal fix:

```sql
-- Add missing columns
ALTER TABLE failed_login_attempts
ADD COLUMN IF NOT EXISTS user_agent TEXT;

ALTER TABLE failed_login_attempts
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Rename column (critical fix)
ALTER TABLE failed_login_attempts
RENAME COLUMN attempt_time TO attempted_at;

-- Test insert
INSERT INTO failed_login_attempts (email, ip_address, user_agent, reason, attempted_at)
VALUES ('test@example.com', '127.0.0.1', 'Test', 'Quick test', NOW());

-- Verify and clean up
SELECT * FROM failed_login_attempts WHERE email = 'test@example.com';
DELETE FROM failed_login_attempts WHERE email = 'test@example.com';
```

---

## 📊 Migration File Location:

**Schema fix SQL:**
```
I:\Apps Back Up\Phaeton AI CRM\supabase\migrations\20251010000006_fix_failed_login_attempts_schema.sql
```

**Diagnostic scripts:**
```
I:\Apps Back Up\Phaeton AI CRM\fix-hostinger-error.mjs           # Test schema
I:\Apps Back Up\Phaeton AI CRM\check-failed-login-table.mjs      # Check table exists
I:\Apps Back Up\Phaeton AI CRM\inspect-failed-login-table.mjs    # Inspect structure
```

---

## ✅ Success Indicators:

After applying the migration, you should see:

1. **No more 400 errors** in browser console
2. **MFA lockout working** - Failed login attempts tracked
3. **Audit logs clean** - No more "Operation failed" messages

---

## 🆘 Troubleshooting:

**Error: "permission denied for table"**
- Solution: Use the Service Role Key in Supabase Dashboard (automatic)

**Error: "relation already exists"**
- Solution: Table already created, you're done!

**Error: "syntax error"**
- Solution: Make sure you copied the entire SQL file (including comments)

---

## 🎯 Summary:

1. Open Supabase Dashboard → SQL Editor
2. Paste schema fix SQL from `20251010000006_fix_failed_login_attempts_schema.sql`
3. Click "Run"
4. Test insert/select with verification query
5. Refresh Hostinger site - error gone! ✅

**What the fix does:**
- ✅ Renames `attempt_time` → `attempted_at`
- ✅ Adds `user_agent` column
- ✅ Adds `reason` column
- ✅ Updates RLS policies
- ✅ Creates performance indexes

---

**Estimated Time:** 2 minutes

**Difficulty:** Easy (copy & paste SQL)

**Impact:** ✅ Fixes Hostinger 400 error + ✅ Enables MFA lockout protection
