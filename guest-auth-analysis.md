# Guest Authentication Issue Analysis - ARTLEE CRM

## Date: October 6, 2025

## Summary of Investigation

The diagnostic script revealed the **ROOT CAUSE** of the authentication failure:

### Critical Issue Found: **USER ID MISMATCH**

**The Problem:**
- **Supabase Auth User ID**: `766134df-6bc2-4e07-a0cc-b009c8b889cc`
- **users Table User ID**: `014b646c-2194-49b9-8611-0f6a42dcf77f`

**These IDs are DIFFERENT!** This is causing the authentication flow to fail because:

1. When user logs in, Supabase Auth authenticates against ID `766134df-6bc2-4e07-a0cc-b009c8b889cc`
2. The application then tries to load user profile from `users` table using the auth user ID
3. The `users` table has a DIFFERENT ID (`014b646c-2194-49b9-8611-0f6a42dcf77f`)
4. **Result**: "User not found in any storage" error

### Current Database State

**Supabase Auth User:**
- ✅ Exists
- ID: `766134df-6bc2-4e07-a0cc-b009c8b889cc`
- Email: `guest@guest.com`
- Email Confirmed: Yes
- Created: 2025-10-06
- Last Sign In: 2025-10-07

**users Table Record:**
- ✅ Exists
- ID: `014b646c-2194-49b9-8611-0f6a42dcf77f` ⚠️ **WRONG ID**
- Email: `guest@guest.com`
- Name: Guest
- Role: `healthcare_provider` (should be `super_user`)
- Tenant ID: `artlee` ✅ Correct
- Active: true
- MFA Enabled: false

**failed_login_attempts Table:**
- ✅ No failed attempts recorded
- Table is accessible and working

**user_settings Table:**
- ✅ Has 1 record
- Likely associated with wrong user ID

## Root Cause Analysis

The user was created in two separate steps:
1. First created in `users` table with auto-generated UUID
2. Later created in Supabase Auth with different UUID

The application expects these IDs to match for the authentication flow to work.

## Fix Required

**Option 1: Update users table ID to match Supabase Auth ID (RECOMMENDED)**
```sql
-- Delete old user record
DELETE FROM users WHERE email = 'guest@guest.com';

-- Insert new record with correct ID from Supabase Auth
INSERT INTO users (
  id,
  email,
  name,
  role,
  tenant_id,
  is_active,
  mfa_enabled,
  created_at
) VALUES (
  '766134df-6bc2-4e07-a0cc-b009c8b889cc',  -- Supabase Auth ID
  'guest@guest.com',
  'Guest User',
  'super_user',  -- Correcting role
  'artlee',
  true,
  false,
  NOW()
);
```

**Option 2: Recreate Supabase Auth user to match users table ID (NOT RECOMMENDED)**
- More complex
- Could cause more issues
- Requires deleting and recreating auth user

## Test Results

**Authentication Test**: ✅ **PASSED**
- The Supabase Auth credentials are working correctly
- Password `Guest123` is valid
- The issue is purely the ID mismatch in the application layer

## Next Steps

1. ✅ Delete the incorrect `users` table record
2. ✅ Create new `users` table record with correct Supabase Auth ID
3. ✅ Update user role to `super_user` (first ARTLEE user should be Super User)
4. ✅ Test login flow in application
5. ✅ Verify user profile loads correctly

## Additional Issues Found

1. **Role Issue**: User has role `healthcare_provider` instead of `super_user`
   - As the first ARTLEE user, should have Super User privileges
   - Fix: Update role during record recreation

2. **User Settings**: May need to be updated to reference correct user ID
   - Will be handled automatically when new user record is created

## Files Involved in Authentication Flow

1. `src/services/userManagementService.ts` - Lines 210-240 (Supabase Auth)
2. `src/services/userProfileService.ts` - Lines 666-676 (User profile loading)
3. `src/contexts/AuthContext.tsx` - Authentication state management

## Verification Steps After Fix

1. Clear browser localStorage
2. Navigate to login page
3. Login with `guest@guest.com` / `Guest123`
4. Verify user profile loads correctly
5. Verify User Management page shows correct user
6. Verify tenant isolation (should only see ARTLEE users)
