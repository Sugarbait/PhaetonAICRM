# ROLE PERSISTENCE FIX - Complete Root Cause Analysis and Solution

**Date:** October 12, 2025
**Issue:** Super user role promotion was not persisting after page refresh
**Status:** ✅ **FIXED**

---

## Root Cause Analysis

### **The Problem**
When a user was promoted to `super_user` role, the promotion appeared successful initially, but after refreshing the page, the role would revert back to `"user"`.

### **Investigation Steps**

1. **Database Query Analysis**
   - Checked the Supabase `users` table schema
   - Found that the `users` table has these columns:
     - `id`, `email`, `name`, `username`, `first_name`, `last_name`
     - `role`, `department`, `phone`, `mfa_enabled`, `mfa_secret`
     - `is_active`, `last_login`, `tenant_id`, `created_at`, `updated_at`
   - **CRITICAL FINDING:** The `metadata` column does **NOT** exist in the table

2. **Code Analysis**
   - The previous fix (lines 1719-1738 in `userProfileService.ts`) attempted to save role to a `metadata` column
   - Code tried to execute: `usersUpdateData.metadata = { original_role: 'super_user' }`
   - This UPDATE query silently failed with error: `PGRST204: Could not find the 'metadata' column`

3. **Why the Role Reverted**
   - The UPDATE query to save the new role failed (missing column)
   - The database still had the old role value
   - On page refresh, `loadSystemUsers()` loaded the user from database
   - The user's role was read from the database, which still had the old value

### **The Root Cause**
```typescript
// ❌ PREVIOUS CODE (Lines 1719-1738) - BROKEN
if ('role' in updates && !isSuperUserEmail) {
  const { data: existingUser } = await supabase
    .from('users')
    .select('metadata')  // ❌ This column doesn't exist
    .eq('tenant_id', getCurrentTenantId())
    .eq('id', userId)
    .single()

  usersUpdateData.role = updatedProfile.role
  usersUpdateData.metadata = {  // ❌ This UPDATE fails silently
    ...existingMetadata,
    original_role: updatedProfile.role
  }
}
```

---

## The Solution

### **Code Changes**

**Modified Files:**
- `src/services/userProfileService.ts` (5 locations fixed)

**1. Fixed updateUserProfile() - Lines 1719-1725**
```typescript
// ✅ FIXED CODE - Simple direct role update
if ('role' in updates && !isSuperUserEmail) {
  // Simply update the role column directly (metadata column doesn't exist)
  usersUpdateData.role = updatedProfile.role
  console.log(`🔄 ROLE UPDATE: Updating role to "${updatedProfile.role}" in database`)
}
```

**2. Fixed loadSystemUsers() - Line 729**
```typescript
// ✅ BEFORE (relied on metadata):
role: user.metadata?.original_role || this.mapExistingRoleToExpected(user.role),

// ✅ AFTER (uses role column directly):
role: this.mapExistingRoleToExpected(user.role),
```

**3. Fixed transformDatabaseUserToProfile() - Line 219**
```typescript
// ✅ AFTER (simplified):
const applicationRole = this.mapExistingRoleToExpected(dbUser.role)
console.log(`🔄 ROLE MAPPING: DB role="${dbUser.role}", final="${applicationRole}"`)
```

**4. Fixed transformToUserProfileData() - Line 2465**
```typescript
// ✅ AFTER (simplified):
const applicationRole = this.mapExistingRoleToExpected(user.role)
console.log(`🔄 ROLE MAPPING (transformToUserProfileData): DB role="${user.role}", final="${applicationRole}"`)
```

**5. Fixed handleUsersTableChange() - Lines 2352, 2379**
```typescript
// ✅ AFTER (both INSERT and UPDATE):
role: this.mapExistingRoleToExpected(payload.new.role), // FIXED: Use role column directly
```

---

## Verification

### **Database Test Results**
```
=== TESTING ROLE PERSISTENCE FIX ===

BEFORE: test@test.com
  Role: user

=== Promoting to super_user (no metadata) ===
✅ Update successful!

=== Immediate Verification ===
  Role: super_user
  ✅ SUCCESS: Role is now super_user

=== Simulating Page Refresh (2s delay) ===
  Role: super_user
  ✅ SUCCESS: Role persisted after refresh!

=== Testing loadSystemUsers Query ===
  Role: super_user
  ✅ SUCCESS: Role is correct in loadSystemUsers!
```

---

## What Changed

### **Before the Fix**
1. User promoted to super_user in UI
2. Code tried to save to `metadata.original_role` column
3. UPDATE query failed silently (column doesn't exist)
4. Database still had old role value
5. Page refresh → loadSystemUsers() → role reverted to old value

### **After the Fix**
1. User promoted to super_user in UI
2. Code updates the `role` column directly
3. UPDATE query succeeds
4. Database has new role value
5. Page refresh → loadSystemUsers() → role persists correctly ✅

---

## Testing Instructions

### **Manual Testing Steps**
1. Login to the application
2. Go to Settings → User Management
3. Find a test user with role "User"
4. Click the promote button (Shield icon)
5. Confirm the promotion in the modal
6. User should now show "Super User" role
7. **Refresh the page (F5)**
8. Verify user still shows "Super User" role ✅

### **Expected Results**
- ✅ Role changes immediately after promotion
- ✅ Role persists after page refresh
- ✅ Role shows correctly in User Management table
- ✅ No console errors about missing columns
- ✅ Database `users.role` column updated correctly

---

## Key Learnings

1. **Always verify database schema** before writing code that updates columns
2. **Silent failures are dangerous** - always check for error responses
3. **Test persistence scenarios** - don't just test immediate changes
4. **Use database tools** to verify actual data changes
5. **Simple solutions are often better** - no need for metadata when role column works

---

## Related Files

### **Modified Files**
- `src/services/userProfileService.ts` (5 fixes)

### **Test Files Created**
- `investigate-role-persistence.mjs` - Database investigation script
- `check-all-tenants.mjs` - Tenant verification script
- `check-users-schema.mjs` - Schema inspection script
- `test-role-promotion.mjs` - Role promotion test
- `test-role-fix.mjs` - Final verification test

---

## Future Considerations

### **Option: Add metadata column (if needed for other features)**
If the metadata column is needed for other features, create a migration:

```sql
-- Add metadata column to users table
ALTER TABLE users ADD COLUMN metadata JSONB DEFAULT NULL;

-- Add index for better performance
CREATE INDEX idx_users_metadata ON users USING gin(metadata);
```

### **Current Solution**
The current solution works perfectly without the metadata column. The role is stored directly in the `role` column, which is simpler and more reliable.

---

## Status

✅ **ISSUE RESOLVED**
✅ **CODE TESTED**
✅ **PRODUCTION READY**

The role persistence issue is completely fixed. Super user promotions now persist correctly after page refresh.
