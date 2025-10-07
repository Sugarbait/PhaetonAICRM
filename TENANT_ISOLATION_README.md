# 🔐 TENANT ISOLATION - CRITICAL SETUP GUIDE

## ⚠️ READ THIS BEFORE CLONING OR DEPLOYING

This CRM uses **multi-tenant architecture** with strict data isolation. All tenants share the same Supabase database but are **completely isolated** by `tenant_id`.

### 🔴 MOST IMPORTANT FILE

**`src/config/tenantConfig.ts` - Line 10:**
```typescript
CURRENT_TENANT: 'artlee' as const,  // ← THIS LINE DEFINES YOUR TENANT
```

### ✅ Current Configuration

- **Tenant ID:** `artlee`
- **Tenant Isolation:** ✅ Enabled with debugging
- **Database:** Shared Supabase (isolated by tenant_id)
- **Other Tenants:** carexps, medex (isolated)

### 🚀 Quick Start - After Cloning

**1. Verify Tenant Isolation:**
```bash
npm run verify:tenant
```

**Expected Output:**
```
✅ Found tenant configuration: "artlee"
✅ Tenant ID format is valid (lowercase, no spaces)
✅ Database: Connected successfully
✅ Isolation: X other tenant(s) isolated correctly
```

**2. If Cloning for New Tenant:**
- [ ] **CRITICAL:** Change `CURRENT_TENANT` in `src/config/tenantConfig.ts`
- [ ] Must be lowercase, no spaces, unique
- [ ] Read `TENANT_ISOLATION_CHECKLIST.md` for full checklist
- [ ] Run `npm run verify:tenant` to confirm

### 📊 Verification Commands

**Check your tenant users:**
```bash
npm run verify:tenant
```

**Check all tenants (diagnostic):**
```bash
node --input-type=module -e "
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase.from('users').select('email, tenant_id');
const byTenant = {};
data.forEach(u => {
  if (!byTenant[u.tenant_id]) byTenant[u.tenant_id] = [];
  byTenant[u.tenant_id].push(u.email);
});
Object.keys(byTenant).forEach(t => console.log(t + ':', byTenant[t].length, 'users'));
"
```

### 🔍 How Tenant Isolation Works

**Every database query automatically filters by tenant_id:**
```typescript
// User creation - automatically sets tenant_id
const userToInsert = {
  email: userData.email,
  name: userData.name,
  tenant_id: getCurrentTenantId()  // ← Auto-filters to current tenant
}

// User loading - automatically filters by tenant_id
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('tenant_id', getCurrentTenantId())  // ← Only loads current tenant users
```

**Console Verification:**
When creating or loading users, browser console shows:
```
🏢 [TENANT] getCurrentTenantId() called - Returning: "artlee"
🏢 [TENANT DEBUG] Creating user with tenant_id: "artlee"
📊 [TENANT DEBUG] Query returned 1 users for tenant "artlee"
```

### 📋 Complete Documentation

- **CLAUDE.md** - Full development guide with cloning instructions
- **TENANT_ISOLATION_CHECKLIST.md** - Step-by-step checklist for cloning
- **verify-tenant-isolation.js** - Automated verification script

### 🚨 Critical Rules

1. ✅ **NEVER** use the same tenant_id as another system
2. ✅ **ALWAYS** run `npm run verify:tenant` after cloning
3. ✅ **ALWAYS** verify browser console shows correct tenant_id
4. ✅ **ALWAYS** rebuild after changing tenant_id
5. ✅ **NEVER** skip verification steps

### 🎯 Common Tenant IDs

- `artlee` - ARTLEE CRM (this repository)
- `carexps` - CareXPS CRM
- `medex` - MedEx CRM

### ❌ Common Mistakes

1. ❌ Forgetting to change tenant_id when cloning
2. ❌ Using uppercase letters in tenant_id
3. ❌ Not running verification after setup
4. ❌ Skipping rebuild after config changes
5. ❌ Not checking browser console logs

### ✅ Success Criteria

**Your setup is correct when:**
- ✅ `npm run verify:tenant` passes all checks
- ✅ Browser console shows correct tenant_id in logs
- ✅ User Management shows only current tenant users
- ✅ No cross-tenant data visible in UI

---

**Need help?** Read `CLAUDE.md` section: "Cloning Guide: Creating New CRM with Proper Tenant Isolation"
