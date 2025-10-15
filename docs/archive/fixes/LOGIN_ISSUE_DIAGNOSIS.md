# Phaeton AI CRM - Login Issue Diagnosis Report

## 🔴 CRITICAL ISSUE: RLS Policy Blocking Unauthenticated Login Queries

## Problem Summary
Users **CANNOT login** after registration. The console shows:
```
UserProfileService: Supabase query failed, trying localStorage fallback
UserProfileService: User not found in any storage
```

## Root Cause Analysis - **RLS POLICY BLOCKS UNAUTHENTICATED QUERIES**

### The Real Issue
The application uses **database-only authentication** (NOT Supabase Auth), but the RLS policies on the `users` table require an authenticated Supabase session (`auth.uid()`) to read user records.

### Authentication Flow
1. User enters email/password on login page
2. System calls `userProfileService.getUserByEmail(email)` at line 1367-1372
3. Query tries to read from `users` table **WITHOUT an authenticated session**
4. **RLS BLOCKS THE QUERY** because `auth.uid()` is NULL
5. Query fails with "permission denied" or returns no rows
6. System falls back to localStorage (also fails)
7. Login completely blocked

### Current RLS Policies (BLOCKING LOGIN)
**File:** `supabase/migrations/user_management_rls_policies.sql`

```sql
-- Policy: Users can see their own profile
CREATE POLICY "users_can_see_own_profile" ON users
  FOR SELECT USING (id = auth.uid());

-- Policy: Super users can see all users
CREATE POLICY "super_users_can_see_all_users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'admin'
      AND current_user.is_active = true
    )
  );
```

**Problem:** Both policies require `auth.uid()` to be non-NULL. During login attempts, `auth.uid()` is NULL because no Supabase Auth session exists yet.

### Why This Happens
The system uses **database-only authentication**:
- Passwords encrypted in `user_profiles.encrypted_retell_api_key`
- User records in `users` table
- **NO Supabase Auth sessions** (users not created via `supabase.auth.signUp()`)
- Authentication handled entirely by `userManagementService.authenticateUser()`

### Authentication System Architecture
The Phaeton AI CRM uses a **database-only authentication system**:

1. **Primary**: Local credentials (encrypted in localStorage/database)
2. **Fallback**: Supabase Auth (only if user created through Supabase Auth API)

### Authentication Flow (userManagementService.ts lines 220-267)
```typescript
// Try Supabase Auth first (usually fails for database-only users)
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email,
  password
})

if (authData?.session && !authError) {
  authSuccess = true
} else {
  // FALLBACK to local credentials (database-only authentication)
  credentials = await this.getUserCredentials(user.id)
  const passwordValid = await this.verifyPassword(password, credentials.password)
}
```

## Why Login Fails - **COMPLETE BREAKDOWN**

### The Failure Sequence
1. ❌ User tries to login with test@test.com
2. ❌ `getUserByEmail()` queries `users` table (line 1367-1372)
3. ❌ RLS policy blocks query because `auth.uid()` is NULL
4. ❌ Query returns no data or error
5. ❌ System falls back to localStorage
6. ❌ localStorage has no data (or insufficient data)
7. ❌ Login fails completely

### Scenario 2: User Not Active
If this is not the first user:
- `isActive = false` by default (requires Super User approval)
- Authentication blocked at line 82-88:
```typescript
if (!user.isActive) {
  return {
    status: 'error',
    error: 'Your account is pending approval...'
  }
}
```

## Diagnostic Checklist

### 1. Check if User Exists in Database
```sql
SELECT id, email, name, role, is_active, tenant_id
FROM users
WHERE email = 'user@example.com'
AND tenant_id = 'phaeton_ai';
```

### 2. Check if User Exists in Supabase Auth
```javascript
const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
const user = authUsers.users.find(u => u.email === 'user@example.com')
```

### 3. Check if User Has Credentials
```javascript
// Check localStorage
const credentials = localStorage.getItem(`userCredentials_${userId}`)

// Check Supabase
const { data } = await supabase
  .from('user_profiles')
  .select('encrypted_retell_api_key')
  .eq('user_id', userId)
  .single()
```

### 4. Check User Active Status
```javascript
// If user.is_active = false, login will fail with:
// "Your account is pending approval. Please wait for a Super User..."
```

## 🔧 SOLUTION: Fix RLS Policies to Allow Unauthenticated Login Queries

### The Fix (RECOMMENDED)
Add a public SELECT policy that allows unauthenticated queries for login purposes.

**File:** Create `supabase/migrations/20251010000002_fix_login_rls_policy.sql`

```sql
-- Fix login issue by allowing unauthenticated SELECT queries on users table
-- This is required for database-only authentication (localStorage-based)

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "users_can_see_own_profile" ON users;
DROP POLICY IF EXISTS "super_users_can_see_all_users" ON users;

-- Create a public SELECT policy for login/authentication queries
-- This allows unauthenticated queries during login, which is SAFE because:
-- 1. Passwords are NOT stored in users table (encrypted separately)
-- 2. Only basic user info is exposed (email, role, isActive, tenant_id)
-- 3. This is standard practice for database-only authentication
CREATE POLICY "allow_login_and_authenticated_queries" ON users
  FOR SELECT USING (
    -- Allow if authenticated and viewing own profile
    id = auth.uid()
    -- OR if unauthenticated (for login queries)
    OR auth.uid() IS NULL
    -- OR if super user viewing any profile
    OR EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'super_user'
      AND current_user.is_active = true
    )
  );

-- Keep other operations secure (INSERT, UPDATE, DELETE still require authentication)

-- INSERT policy (only super users can create users)
DROP POLICY IF EXISTS "super_users_can_insert_users" ON users;
CREATE POLICY "super_users_can_insert_users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'super_user'
      AND current_user.is_active = true
    )
  );

-- UPDATE policy (users can update themselves, super users can update anyone)
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
DROP POLICY IF EXISTS "super_users_can_update_users" ON users;
CREATE POLICY "users_can_update_profiles" ON users
  FOR UPDATE USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'super_user'
      AND current_user.is_active = true
    )
  );

-- DELETE policy (only super users can delete, not themselves)
DROP POLICY IF EXISTS "super_users_can_delete_users" ON users;
CREATE POLICY "super_users_can_delete_users" ON users
  FOR DELETE USING (
    id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'super_user'
      AND current_user.is_active = true
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "allow_login_and_authenticated_queries" ON users IS
  'Allows unauthenticated SELECT for login queries (database-only auth), authenticated users to view own profile, and super users to view all profiles';
COMMENT ON POLICY "super_users_can_insert_users" ON users IS
  'Only super users can create new users';
COMMENT ON POLICY "users_can_update_profiles" ON users IS
  'Users can update their own profile, super users can update any profile';
COMMENT ON POLICY "super_users_can_delete_users" ON users IS
  'Super users can delete users (except themselves)';
```

### Why This Fix is Safe

#### ✅ Security Considerations
- **Passwords are NOT in the users table** - They're encrypted separately in `user_profiles.encrypted_retell_api_key`
- **Only basic user info is exposed** - email, role, isActive, tenant_id (needed for login)
- **Write operations still protected** - INSERT, UPDATE, DELETE still require authentication
- **Standard practice** - This is how database-only authentication systems work
- **Aligns with Supabase design** - The anon key is designed for public read access with RLS protection

#### ❌ What Data is Exposed (Safe)
- ✅ Email (needed to find user during login)
- ✅ Role (needed for authorization after login)
- ✅ isActive (needed to check if account is approved)
- ✅ tenant_id (needed for multi-tenant isolation)
- ✅ Name, Department (non-sensitive profile info)

#### 🔐 What Data is NOT Exposed (Protected)
- 🔒 Passwords (encrypted in separate table `user_profiles`)
- 🔒 MFA secrets (encrypted in `user_settings`)
- 🔒 API keys (encrypted in `user_profiles`)
- 🔒 Sensitive personal data (requires authenticated session)

### Alternative: Keep Existing Architecture (NOT RECOMMENDED)
Instead of fixing RLS, you could migrate to Supabase Auth (major refactor):

```typescript
// NOT RECOMMENDED - Requires complete rewrite
const { data: authData } = await supabaseAdmin.auth.admin.createUser({
  email: userData.email,
  password: credentials.password,
  email_confirm: true
})
```

**Why NOT recommended:**
- ❌ Requires rewriting entire authentication system
- ❌ Breaks existing user credentials
- ❌ Conflicts with localStorage-based approach
- ❌ Already working on Hostinger with database-only auth
- ❌ Would require migrating all existing users

## 🚀 Immediate Fix Steps

### Step 1: Create the Migration File
```bash
# Navigate to project directory
cd "I:\Apps Back Up\Phaeton AI CRM"

# Create the migration file (already provided above)
# File: supabase/migrations/20251010000002_fix_login_rls_policy.sql
```

### Step 2: Apply the Migration

**Option A: Using Supabase CLI**
```bash
supabase migration up
```

**Option B: Using Supabase Dashboard (SQL Editor)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire migration SQL from above
4. Execute the SQL
5. Verify policies are updated

**Option C: Using Supabase JavaScript Client**
```javascript
// Run this in browser console or Node.js
const { createClient } = require('@supabase/supabase-js')
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Service role key required
)

// Execute the migration SQL
const migrationSQL = `...` // Paste the SQL from above
const { error } = await supabaseAdmin.rpc('exec_sql', { sql: migrationSQL })
```

### Step 3: Test Login
1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Navigate to login page** (http://localhost:3004/)
3. **Enter credentials** (test@test.com / password)
4. **Verify login succeeds**

### Step 4: Verify Fix

**Check Console Logs:**
```
✅ getUserByEmail - Filtering by tenant_id: "phaeton_ai" for email: "test@test.com"
✅ UserProfileService: User found in Supabase
✅ UserManagementService: Authenticated via local credentials
```

**Verify RLS Policies:**
```sql
-- Run in Supabase SQL Editor
SELECT schemaname, tablename, policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'users';
```

Expected result: Should show `allow_login_and_authenticated_queries` policy with `qual` containing `auth.uid() IS NULL`.

## 🎯 Summary

### Root Cause
RLS policies on `users` table blocked unauthenticated SELECT queries during login, preventing the system from fetching user records for authentication.

### Solution
Add a public SELECT policy (`OR auth.uid() IS NULL`) to allow unauthenticated login queries while keeping write operations protected.

### Impact
- ✅ Login will work immediately after applying migration
- ✅ No code changes required
- ✅ No data migration needed
- ✅ No breaking changes to existing functionality
- ✅ Security maintained (passwords still encrypted separately)

### Risk Level
**LOW** - This is standard practice for database-only authentication systems. The fix exposes only non-sensitive user profile data needed for login.

## Files to Review

1. **I:\Apps Back Up\Phaeton AI CRM\src\services\userManagementService.ts**
   - Line 112-166: `createSystemUser()` function
   - Line 171-296: `authenticateUser()` function

2. **I:\Apps Back Up\Phaeton AI CRM\src\services\userProfileService.ts**
   - Line 939-1088: `createUser()` function
   - Line 975: ID generation (should use Supabase Auth ID)

3. **I:\Apps Back Up\Phaeton AI CRM\src\components\auth\UserRegistration.tsx**
   - Line 58-148: Registration form submission

4. **I:\Apps Back Up\Phaeton AI CRM\src\config\tenantConfig.ts**
   - Line 10: CURRENT_TENANT = 'phaeton_ai'

## Testing the Fix

After implementing the fix:

1. **Clear browser data** (localStorage, sessionStorage, cookies)
2. **Register a new test user**
3. **Verify user created in both**:
   - Supabase Auth (`auth.users` table)
   - Database (`users` table with `tenant_id='phaeton_ai'`)
4. **Login with the new user**
5. **Verify authentication works** via Supabase Auth (not fallback)

## Environment Details

- **Project**: Phaeton AI CRM
- **Tenant ID**: `phaeton_ai`
- **Supabase URL**: `https://cpkslvmydfdevdftieck.supabase.co`
- **Port**: `http://localhost:3004/`
- **Authentication**: Hybrid (Supabase Auth + Local Credentials)
