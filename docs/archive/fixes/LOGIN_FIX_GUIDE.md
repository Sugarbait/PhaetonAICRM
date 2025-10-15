# Phaeton AI CRM - Login & Registration Fix Guide

**Date:** October 10, 2025
**Tenant:** phaeton_ai
**Database:** cpkslvmydfdevdftieck.supabase.co

---

## 🎯 Quick Fix Summary

If you're experiencing registration or login issues, follow these steps in order:

### Step 1: Run Diagnostic
```bash
node check-test-user.js
```

### Step 2: Apply Database Fix (if needed)
Run this in Supabase SQL Editor:
```sql
ALTER TABLE users
ALTER COLUMN id
SET DEFAULT gen_random_uuid();
```

Or run the migration file:
```sql
-- Run: supabase/migrations/20251010000001_fix_users_uuid_default.sql
```

### Step 3: Test Registration
Open `http://localhost:3000` and try creating a new user.

---

## 🔴 Problem 1: Registration Fails with "Registration Failed" Error

### Symptoms:
- User fills registration form
- Clicks "Create Account"
- Gets generic "Registration failed" message
- Browser console shows: `null value in column "id" violates not-null constraint`

### Root Cause:
The `users` table `id` column does not automatically generate UUIDs.

### Fix:
Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE users
ALTER COLUMN id
SET DEFAULT gen_random_uuid();
```

### Verification:
```bash
node test-direct-create.js
```

This should create and delete a test user successfully.

---

## 🔴 Problem 2: "User Already Exists" But Database is Empty

### Symptoms:
- Registration says user exists
- `check-test-user.js` shows 0 users
- Database query shows no users

### Diagnostic Steps:

1. **Check Supabase Auth:**
   - Go to Supabase Dashboard → Authentication → Users
   - Search for the email
   - If user exists in Auth but not database → Delete from Auth

2. **Clear localStorage:**
   ```javascript
   // In browser console (F12)
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

3. **Verify Tenant:**
   - Check `src/config/tenantConfig.ts`
   - Ensure `CURRENT_TENANT: 'phaeton_ai'`

---

## 🔴 Problem 3: First User Not Getting Super User Role

### Symptoms:
- First user created with role 'user' instead of 'super_user'
- User requires approval

### Diagnostic:
```bash
node check-test-user.js
```

Check the "TENANT USER COUNT" section.

### Fix (if first user already created with wrong role):
```sql
UPDATE users
SET role = 'super_user',
    is_active = true
WHERE tenant_id = 'phaeton_ai'
  AND email = 'your-email@example.com';
```

---

## 🔴 Problem 4: Login Not Working After Registration

### Symptoms:
- User successfully registers
- Cannot log in with credentials
- "Invalid credentials" error

### Diagnostic:
```bash
node check-test-user.js
```

### Common Causes:

1. **User in database but not in Supabase Auth:**
   - Delete user from database
   - Register again (registration should create both)

2. **Stale localStorage:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```

3. **Account not activated:**
   ```sql
   UPDATE users
   SET is_active = true
   WHERE email = 'your-email@example.com'
     AND tenant_id = 'phaeton_ai';
   ```

---

## 🛠️ Diagnostic Tools

### 1. Check Database State
```bash
node check-test-user.js
```

Shows:
- Users in database (Y/N)
- Total user count per tenant
- All registered users

### 2. Test Direct User Creation
```bash
node test-direct-create.js
```

Attempts to create a user and shows exact error if it fails.

### 3. Browser Console Check
Press F12, go to Console tab, look for:
- Red errors (especially error code 23502)
- Failed network requests (400/500 status)

---

## 📋 SQL Diagnostic Queries

### Check UUID Default:
```sql
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id';
```
Expected: `gen_random_uuid()`

### Count Users Per Tenant:
```sql
SELECT tenant_id, COUNT(*) as count
FROM users
GROUP BY tenant_id;
```

### Find First User:
```sql
SELECT id, email, role, is_active, created_at
FROM users
WHERE tenant_id = 'phaeton_ai'
ORDER BY created_at ASC
LIMIT 1;
```

### Check Specific User:
```sql
SELECT *
FROM users
WHERE email = 'your-email@example.com'
  AND tenant_id = 'phaeton_ai';
```

### Delete Specific User (for testing):
```sql
DELETE FROM users
WHERE email = 'test@test.com'
  AND tenant_id = 'phaeton_ai';
```

---

## 🎯 Expected Working Flow

After fixes applied:

1. ✅ User opens `/register` page
2. ✅ Fills form with email, password, name
3. ✅ Clicks "Create Account"
4. ✅ System checks: 0 users found → First user!
5. ✅ Creates user with:
   - `role = 'super_user'`
   - `is_active = true`
   - `tenant_id = 'phaeton_ai'`
   - `id = auto-generated UUID`
6. ✅ Shows success message: "Congratulations! As the first user, you are Super User"
7. ✅ User can log in immediately
8. ✅ Dashboard loads successfully

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't forget tenant_id filter:
```typescript
// WRONG - returns all users
.from('users').select('*')

// CORRECT - returns only phaeton_ai users
.from('users').select('*').eq('tenant_id', 'phaeton_ai')
```

### ❌ Don't skip UUID default:
```sql
-- Must have this for user creation to work
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
```

### ❌ Don't assume localStorage is empty:
Always clear before testing:
```javascript
localStorage.clear()
sessionStorage.clear()
```

---

## 📊 Key Configuration Files

### Tenant Configuration:
**File:** `src/config/tenantConfig.ts`
```typescript
export const TENANT_CONFIG = {
  CURRENT_TENANT: 'phaeton_ai' as const
}
```

### Environment Variables:
**File:** `.env.local`
```bash
VITE_SUPABASE_URL=https://cpkslvmydfdevdftieck.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Registration Logic:
**File:** `src/components/auth/UserRegistration.tsx` (Lines 72-94)
- Checks for first user
- Assigns `super_user` role if first
- Auto-activates first user

### User Creation Service:
**File:** `src/services/userManagementService.ts` (Lines 112-166)
- Creates user profile
- Saves credentials
- Handles authentication

---

## 💡 Pro Tips

1. **Always test with a fresh browser:**
   - Open incognito/private window
   - Or clear all localStorage/cookies

2. **Check console logs:**
   - Look for emoji-prefixed logs (✅, ❌, 🔍)
   - These show authentication flow

3. **First user is special:**
   - Gets `super_user` role automatically
   - Activated immediately
   - Can manage all other users

4. **Subsequent users:**
   - Get `user` role
   - Require Super User approval
   - `is_active` starts as `false`

---

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Run all diagnostics:**
   ```bash
   node check-test-user.js
   node test-direct-create.js
   ```

2. **Check Supabase Dashboard:**
   - Database → Table Editor → users
   - Authentication → Users
   - Compare what you see in both places

3. **Clear everything:**
   ```javascript
   // Browser console
   localStorage.clear()
   sessionStorage.clear()
   ```

   ```sql
   -- Supabase SQL Editor (CAUTION: Deletes all users!)
   DELETE FROM users WHERE tenant_id = 'phaeton_ai';
   ```

4. **Try registration again from scratch**

---

## 📞 Support

For additional help:
- Check CLAUDE.md for system architecture
- Review audit logs in Settings → Audit Logs
- Contact system administrator

---

**Last Updated:** October 10, 2025
**Version:** 1.0
**Status:** Production Ready
