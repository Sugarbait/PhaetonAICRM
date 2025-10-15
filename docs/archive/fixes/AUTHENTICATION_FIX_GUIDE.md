# ARTLEE Authentication Fix Guide

## Problem Description

**Issue:** User `create@artlee.agency` exists in the database with ID `d4ca7563-c542-44b4-bb9c-f4d8fb5ab71a`, but was created in Supabase Auth with a different ID `6fb26981-a8f6-479c-9995-36cd238ca185`. This causes authentication to fail because the IDs don't match.

## Root Cause

The authentication system in ARTLEE CRM works as follows:

1. **User Creation:** When a user registers, the system creates a record in the `users` table in Supabase
2. **Authentication:** When logging in, the system tries Supabase Auth first, then falls back to database-only authentication
3. **ID Matching:** For Supabase Auth to work properly, the Auth user ID must match the database user ID

## Solution Options

### Option 1: Update Database User ID (RECOMMENDED)

This is the cleanest solution. Update the database `users` table to use the Auth ID.

**Steps:**
1. Open `fix-artlee-auth.html` in your browser
2. Click "Run Diagnostics" to verify the issue
3. Click "Update Database User ID" under Option 1
4. Test login with the credentials

**What it does:**
- Updates the `users` table record to use the Supabase Auth ID (`6fb26981-a8f6-479c-9995-36cd238ca185`)
- Preserves all user data and settings
- Makes Auth and database IDs consistent

### Option 2: Delete and Recreate Auth User

This option deletes the Supabase Auth user and creates a new one. However, **Supabase Auth does not allow custom IDs**, so this will create a NEW random ID, which then requires running Option 1 anyway.

**Not recommended** - use Option 1 instead.

### Option 3: Create Fresh User

If you want to start completely fresh with a new email address:

**Steps:**
1. Open `fix-artlee-auth.html` in your browser
2. Enter new user details under Option 3
3. Click "Create Fresh User"
4. Login with the new credentials

**What it does:**
- Creates a new Supabase Auth user
- Creates a matching database user with the same ID
- Sets up proper tenant isolation (`tenant_id = 'artlee'`)

## Testing Authentication

After applying the fix:

1. Use the "Test Login" section in `fix-artlee-auth.html`
2. Enter credentials:
   - Email: `create@artlee.agency`
   - Password: `test1000!`
3. Click "Test Login"
4. Should show "✅ IDs MATCH - Authentication working correctly!"

Or test in the actual app:
1. Open http://localhost:3002
2. Login with the credentials
3. Should successfully authenticate and reach the dashboard

## Understanding the Authentication Flow

### Dual Authentication System

ARTLEE CRM supports two authentication methods:

1. **Supabase Auth** (lines 220-245 in `userManagementService.ts`)
   - Uses Supabase's built-in authentication
   - Requires matching IDs between Auth and database
   - Tries first during login

2. **Database-only Auth** (lines 247-267 in `userManagementService.ts`)
   - Falls back when Supabase Auth fails
   - Uses encrypted credentials in `user_settings` table or localStorage
   - Works on Hostinger when Supabase API is unreachable

### Why the ID Mismatch Happened

When users are created through the registration form:

1. `userManagementService.createSystemUser()` is called (line 96 in `UserRegistration.tsx`)
2. It calls `userProfileService.createUser()` which creates database record
3. The database generates a random UUID for the user
4. If Supabase Auth is also created, it generates its OWN random UUID
5. These two UUIDs don't match, causing authentication issues

### Proper User Creation Flow

For proper user creation with Auth:

1. Create Supabase Auth user FIRST
2. Get the Auth user ID
3. Create database user with THE SAME ID
4. This ensures ID consistency

Example code:
```typescript
// Create auth user first
const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password123',
  email_confirm: true
})

// Then create database user with SAME ID
const { data: dbUser, error: dbError } = await supabase
  .from('users')
  .insert({
    id: authUser.user.id,  // Use Auth ID
    email: 'user@example.com',
    name: 'User Name',
    role: 'user',
    tenant_id: 'artlee',
    is_active: true
  })
```

## Tenant Isolation

**CRITICAL:** All ARTLEE users MUST have `tenant_id = 'artlee'` in the database. This ensures complete data separation from MedEx (`medex`) and CareXPS (`carexps`) tenants.

The fix tool automatically sets `tenant_id = 'artlee'` when creating or updating users.

## Files Involved

- **Authentication Service:** `src/services/userManagementService.ts` (lines 112-166, 171-297)
- **User Profile Service:** `src/services/userProfileService.ts` (lines 1002-1200)
- **User Registration:** `src/components/auth/UserRegistration.tsx` (lines 58-150)
- **Tenant Config:** `src/config/tenantConfig.ts` (getCurrentTenantId())

## Verification Checklist

After applying the fix, verify:

- [ ] User can login at http://localhost:3002
- [ ] Login with `create@artlee.agency` / `test1000!` succeeds
- [ ] User reaches the dashboard without errors
- [ ] Console shows "✅ Authenticated via Supabase Auth"
- [ ] Database user ID matches Auth user ID
- [ ] User has `tenant_id = 'artlee'` in database

## Troubleshooting

### Still can't login after fix

1. Check browser console for errors
2. Verify IDs match using diagnostics tool
3. Try clearing browser localStorage: `localStorage.clear()`
4. Check Supabase Auth dashboard for user status
5. Verify database user has `is_active = true`

### "Account pending approval" error

User's `is_active` field is false. Update it:

```javascript
// In browser console or fix tool
await supabase
  .from('users')
  .update({ is_active: true })
  .eq('email', 'create@artlee.agency')
  .eq('tenant_id', 'artlee')
```

### Auth user not found

Recreate the Auth user:

```javascript
await supabase.auth.admin.createUser({
  email: 'create@artlee.agency',
  password: 'test1000!',
  email_confirm: true
})
```

Then run Option 1 to sync IDs.

## Prevention

To prevent this issue in the future, the user creation flow should be updated to:

1. Create Supabase Auth user first
2. Extract the Auth user ID
3. Create database user with the same ID

This ensures ID consistency from the start.

---

**Status:** Ready to fix
**Created:** 2025-10-08
**Last Updated:** 2025-10-08
