# User Registration Fix - UUID Generation Issue

## Problem Summary

Users cannot register in Phaeton AI CRM due to invalid UUID format in user ID generation.

### Root Cause
The `userProfileService.ts` generates user IDs using this pattern:
```typescript
const newUserId = `artlee_${Date.now()}_${crypto.randomUUID()}`
```

This produces strings like `artlee_1760100221397_abc123` which are **NOT valid UUIDs**.

The Supabase `users` table has `id` column with type `UUID`, causing this error:
```
invalid input syntax for type uuid: "artlee_1760100221397..."
ERROR CODE: 22P02
```

## Solution

Change the ID generation to use proper UUID format:

### File: `src/services/userProfileService.ts`

**Line 975** - Change from:
```typescript
const newUserId = `artlee_${Date.now()}_${crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)}`
```

**To:**
```typescript
const newUserId = crypto.randomUUID()
```

**Line 1093** (localStorage fallback) - Change from:
```typescript
const newUserId = `local_user_${Date.now()}_${crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)}`
```

**To:**
```typescript
const newUserId = crypto.randomUUID()
```

## Why This Fix Works

1. **UUID Format**: `crypto.randomUUID()` generates RFC 4122 version 4 UUIDs (e.g., `550e8400-e29b-41d4-a716-446655440000`)
2. **Database Compatible**: Supabase UUID columns accept this standard format
3. **Unique**: UUIDs are globally unique, no collision risk
4. **No Breaking Changes**: The system only uses IDs for lookups, format doesn't matter to application logic

## Testing

After applying the fix, test with:

```javascript
// In browser console or Node.js
console.log(crypto.randomUUID())
// Output: "550e8400-e29b-41d4-a716-446655440000" ✅
```

## Implementation Steps

1. ✅ **Diagnosis Complete** - UUID format issue identified
2. 🔧 **Apply Fix** - Update `userProfileService.ts` lines 975 and 1093
3. 🧪 **Test Registration** - Try registering first user
4. ✅ **Verify Success** - Check Supabase dashboard for new user
5. 🔐 **Test Login** - Confirm authentication works

## Additional Notes

- **Tenant Isolation**: The fix maintains `tenant_id = 'phaeton_ai'` filtering
- **First User**: Still gets `super_user` role automatically
- **Subsequent Users**: Still require Super User approval (`isActive: false`)
- **No Data Loss**: Existing users (if any) are not affected

## Error Message Update

The misleading error "cannot sign in, please make sure the Supabase auth is set up properly" will be resolved because:
1. User creation will succeed (valid UUID)
2. Credentials will be saved properly
3. Authentication (Supabase Auth or localStorage fallback) will work

The error was occurring because user creation failed before credentials could be saved.
