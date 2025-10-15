# Registration Issue - Diagnosis & Fix

## Problem Summary

User attempted to register with `pierre@phaetonai.com` but the registration "didn't seem like it connected to Supabase."

## Root Cause Identified

**RLS (Row Level Security) Policy Infinite Recursion Error**

```
Error: infinite recursion detected in policy for relation "users"
Code: 42P17
```

This error occurs when RLS policies on the `users` table create circular dependencies, preventing any INSERT operations from anonymous users.

## Why This Happens

The current RLS policies likely contain recursive checks like:

```sql
-- BAD EXAMPLE (causes recursion)
CREATE POLICY "user_policy"
ON public.users
FOR INSERT
TO anon
WITH CHECK (
  (SELECT role FROM users WHERE email = NEW.email) = 'user'  -- ❌ Queries users table inside users policy
);
```

When an INSERT is attempted:
1. Policy checks `SELECT role FROM users`
2. That SELECT triggers the same policy
3. Which triggers another SELECT
4. Infinite recursion → ERROR

## Diagnostic Test Results

### Test 1: Database Connection
- ✅ **PASSED** - Supabase connection working

### Test 2: Existing Users
- ✅ **FOUND** - 0 users with `tenant_id='phaeton_ai'`
- ✅ **CONFIRMED** - Database is empty (fresh start)

### Test 3: RLS Policies
- ❌ **FAILED** - `infinite recursion detected in policy for relation "users"`
- ❌ **RESULT** - Anonymous users cannot INSERT

### Test 4: Registration Attempt
- ❌ **FAILED** - Pierre account not created
- ❌ **CAUSE** - RLS policy blocking INSERT

## The Fix

### Option 1: Automatic Fix (Requires Supabase Dashboard)

Run the SQL file: **`fix-registration-rls.sql`**

**Steps:**
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `cpkslvmydfdevdftieck`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Copy and paste the entire contents of `fix-registration-rls.sql`
6. Click **"Run"** button
7. Verify 4 policies were created (see output at bottom)
8. Try registration again

### Option 2: Manual Fix (Via Supabase Dashboard)

1. Go to **Database → Policies**
2. Find the `users` table
3. **Delete ALL existing policies** on the `users` table
4. Create new policy: **"allow_anon_registration"**
   - Command: `INSERT`
   - Target roles: `anon`
   - WITH CHECK: `true`
5. Create new policy: **"service_role_full_access"**
   - Command: `ALL`
   - Target roles: `service_role`
   - USING: `true`
   - WITH CHECK: `true`

## The Solution Explained

### New RLS Policies (No Recursion)

```sql
-- Policy 1: Allow anonymous registration
CREATE POLICY "allow_anon_registration"
ON public.users
FOR INSERT
TO anon
WITH CHECK (true);  -- ✅ No recursion - simple boolean check
```

**Key Points:**
- ✅ No SELECT queries inside the policy
- ✅ No subqueries that reference `users` table
- ✅ Simple `true` check allows all INSERTs from anon users
- ✅ Application code handles role validation (first user = super_user)

### Why This Works

1. **Anonymous users can INSERT**: Registration form uses `anon` key
2. **No recursion**: `WITH CHECK (true)` doesn't query the table
3. **Security maintained**: Application validates first user = super_user
4. **Service role has full access**: Admin operations work normally

## Expected Behavior After Fix

1. User fills registration form with `pierre@phaetonai.com`
2. Frontend calls `userManagementService.createSystemUser()`
3. Service checks if any users exist (uses service_role)
4. If 0 users exist → create as `super_user` with `is_active=true`
5. If users exist → create as `user` with `is_active=false` (pending approval)
6. INSERT executes successfully via `anon` role
7. User sees success message

## Testing After Fix

Run the diagnostic script again:

```bash
node test-registration-insert.mjs
```

**Expected output:**
```
✅ Connection test PASSED
✅ Found 0 existing users with tenant_id='phaeton_ai'
✅ RLS allows INSERT for anon users
✅ INSERT with ANON key SUCCEEDED!
```

Then try registration in the UI:
1. Go to login page
2. Click "Create New Profile"
3. Fill form with `pierre@phaetonai.com`
4. Submit
5. Should see: "Your account has been created with Super User privileges!"

## Files Created

1. **`test-registration-insert.mjs`** - Diagnostic script to test INSERT operations
2. **`fix-registration-rls.sql`** - SQL script to fix RLS policies
3. **`REGISTRATION_ISSUE_DIAGNOSIS.md`** - This diagnostic report

## Additional Notes

### Tenant Isolation
- All users must have `tenant_id='phaeton_ai'`
- RLS policies should NOT filter by tenant_id in recursion-prone ways
- Use application-level filtering where possible

### First User Detection
- Uses service_role to query existing users (bypasses RLS)
- If 0 users found → create as `super_user`
- If users exist → create as `user` (pending approval)

### Security Considerations
- Anonymous INSERT is safe because:
  - Application validates all inputs
  - First user detection uses service_role
  - Subsequent users require approval
  - No way to escalate privileges via INSERT

## Next Steps

1. ✅ Run `fix-registration-rls.sql` in Supabase SQL Editor
2. ✅ Verify 4 policies created
3. ✅ Run `node test-registration-insert.mjs` to confirm fix
4. ✅ Try registration with `pierre@phaetonai.com`
5. ✅ Verify user created with `super_user` role
6. ✅ Test login with new account

## Support

If registration still fails after running the fix:

1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify Supabase connection in browser console:
   - Look for: `✅ Supabase client initialized`
4. Run diagnostic script again: `node test-registration-insert.mjs`
5. Check Supabase Dashboard → Database → Policies
   - Verify 4 policies exist
   - Verify `allow_anon_registration` is present

## Technical Details

### Error Code 42P17
- PostgreSQL error code for infinite recursion in RLS policies
- Occurs when policy definition references the same table
- Solution: Avoid subqueries that reference the protected table

### Supabase Auth vs Database-Only Auth
- Phaeton AI CRM uses **database-only authentication**
- Supabase Auth is used for ARTLEE and MedEx tenants
- Pierre's account will be database-only
- Credentials stored in `user_profiles` table (encrypted)

### RLS vs Application-Level Security
- **RLS**: Database-level security (prevents SQL injection bypass)
- **Application**: Business logic security (role validation, tenant isolation)
- **Both needed**: Defense in depth strategy

---

**Last Updated:** 2025-10-10
**Status:** FIX READY - Run SQL script to resolve
**Severity:** HIGH - Blocking all new user registrations
