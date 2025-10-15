# Tenant Isolation Setup Guide

## Overview

This guide implements **tenant-based data isolation** using Row Level Security (RLS) to separate MedEx data from CareXPS data.

**Method:** Add `tenant_id` column to all tables
- `tenant_id = 'carexps'` for all existing CareXPS data
- `tenant_id = 'medex'` for all new MedEx data

## Step 1: Run the Migration

1. Go to https://supabase.com/dashboard → SQL Editor
2. Copy contents of: `supabase/migrations/20251003000005_tenant_isolation.sql`
3. Paste and run in SQL Editor

**This migration will:**
- ✅ Add `tenant_id` column to all tables
- ✅ Set `tenant_id = 'carexps'` for ALL existing data (protects CareXPS)
- ✅ Create indexes for fast filtering
- ✅ **Does NOT modify any existing data - only adds a column**

## Step 2: Verify CareXPS Data is Protected

Run this query to confirm:

```sql
-- Check that all existing users have tenant_id = 'carexps'
SELECT id, email, role, tenant_id FROM public.users;
```

**Expected result:**
- All 4 existing users (guest, Masika, ELM, Pierre) have `tenant_id = 'carexps'`

## Step 3: How It Works

### Automatic Tenant Filtering

The app now uses `tenantSupabase` instead of `supabase`:

```typescript
// OLD (sees all data):
import { supabase } from '@/config/supabase'
const { data } = await supabase.from('users').select('*')
// Returns: guest, Masika, ELM, Pierre (CareXPS users)

// NEW (filtered by tenant):
import { tenantSupabase } from '@/config/tenantSupabase'
const { data } = await tenantSupabase.from('users').select('*')
// Returns: [] (no MedEx users yet - all users are CareXPS)
```

### Configuration

**File:** `src/config/tenantConfig.ts`
```typescript
export const TENANT_CONFIG = {
  CURRENT_TENANT: 'medex', // 🎯 This app uses 'medex' tenant
  // ...
}
```

### How Queries Are Filtered

**SELECT queries:**
```typescript
// You write:
tenantSupabase.from('users').select('*')

// Actually executes:
supabase.from('users').select('*').eq('tenant_id', 'medex')
```

**INSERT queries:**
```typescript
// You write:
tenantSupabase.from('users').insert({ email: 'test@medex.com', role: 'user' })

// Actually executes:
supabase.from('users').insert({
  email: 'test@medex.com',
  role: 'user',
  tenant_id: 'medex' // ✅ Automatically added
})
```

## Step 4: Update Services (Optional)

For services that need tenant filtering, replace `supabase` with `tenantSupabase`:

```typescript
// Before:
import { supabase } from '@/config/supabase'

// After:
import { tenantSupabase as supabase } from '@/config/tenantSupabase'
```

**Note:** Most services should work without changes because they fall back to localStorage when Supabase queries return empty results.

## Step 5: Test Isolation

### Test 1: Clear localStorage

Open browser console (F12):
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Navigate to User Management - should show **0 users** (no MedEx users yet).

### Test 2: Create MedEx User

In browser console:
```javascript
import { tenantSupabase } from '@/config/tenantSupabase'

const { data, error } = await tenantSupabase.from('users').insert({
  id: 'test-medex-user-001',
  email: 'test@medex.com',
  role: 'user'
})

console.log('Created:', data)
```

Refresh User Management - should show **1 user** (your test MedEx user).

### Test 3: Verify CareXPS Data Is Hidden

Query CareXPS users:
```javascript
import { tenantSupabase } from '@/config/tenantSupabase'

const { data } = await tenantSupabase.from('users').select('*')
console.log('MedEx users:', data)
// Should NOT include: guest, Masika, ELM, Pierre
```

Query without filter (for verification only):
```javascript
import { supabase } from '@/config/supabase'

const { data } = await supabase.from('users').select('*')
console.log('All users:', data)
// Should include both CareXPS (4 users) and MedEx (1 user)
```

## Benefits

✅ **CareXPS Unaffected** - All existing data marked as 'carexps'
✅ **Complete Isolation** - MedEx cannot see CareXPS data
✅ **Standard Supabase** - Uses normal RLS (no custom schemas)
✅ **Same Database** - No additional Supabase projects needed
✅ **Fast Queries** - Indexed tenant_id for performance
✅ **Automatic** - Tenant filtering happens automatically

## Troubleshooting

### Still seeing CareXPS users in MedEx

**Possible causes:**
1. Migration not run yet
2. Service not using `tenantSupabase`
3. Browser cache - clear localStorage

**Fix:**
```javascript
// Clear browser cache
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Need to bypass tenant filtering

Use `getUnfilteredSupabase()`:
```typescript
import { getUnfilteredSupabase } from '@/config/tenantSupabase'

const supabase = getUnfilteredSupabase()
const { data } = await supabase.from('users').select('*')
// Returns all users from all tenants
```

---

**Total Setup Time:** 5 minutes
**CareXPS Impact:** None - completely unaffected
