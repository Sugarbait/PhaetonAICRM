# 🔐 TENANT ISOLATION CHECKLIST

**Use this checklist when cloning ARTLEE to create a new CRM tenant**

## ✅ Pre-Deployment Checklist

### Step 1: Tenant Configuration (CRITICAL)
- [ ] Updated `src/config/tenantConfig.ts`
  - [ ] Changed `CURRENT_TENANT` to unique value (lowercase, no spaces)
  - [ ] Added new tenant to `TENANTS` object
  - [ ] Verified tenant ID is unique (not used by other systems)

### Step 2: Branding Updates
- [ ] Updated `package.json` name and description
- [ ] Updated `index.html` title and meta description
- [ ] Updated `public/manifest.json` PWA manifest
- [ ] Updated `vite.config.ts` PWA manifest
- [ ] Updated `src/main.tsx` loading screen text

### Step 3: Data Cleanup
- [ ] Cleared all API credentials in `src/config/retellCredentials.ts`
- [ ] Removed all pre-existing logos from `public/images/`
- [ ] Removed `public/favicon.png` if exists
- [ ] Removed `public/vite.svg` if exists
- [ ] Verified no hardcoded demo users in code

### Step 4: Environment Setup
- [ ] Created `.env.local` with unique credentials
- [ ] Set unique Azure AD client ID
- [ ] Set unique encryption keys (PHI and Audit)
- [ ] Verified Supabase credentials are correct

### Step 5: Build & Test
- [ ] Ran `npm install` successfully
- [ ] Ran `npm run build` successfully
- [ ] Started dev server with `npm run dev`

### Step 6: Verification (MANDATORY)
- [ ] Browser console shows correct tenant_id in logs:
  ```
  🏢 [TENANT] getCurrentTenantId() called - Returning: "your_tenant_id"
  ```
- [ ] Created test user via registration
- [ ] Verified user has correct tenant_id in database
- [ ] Verified User Management shows only current tenant users
- [ ] Verified NO users from other tenants are visible

### Step 7: Database Verification
- [ ] Ran diagnostic script to check tenant isolation
- [ ] Confirmed 0 existing users for new tenant
- [ ] Verified user creation assigns correct tenant_id
- [ ] Checked no cross-tenant data leakage

### Step 8: Final Checks
- [ ] Documented tenant_id in project README
- [ ] Tested user login flow
- [ ] Tested user registration flow
- [ ] Verified MFA setup (if enabled)
- [ ] Tested all main features work correctly

## 🚨 Critical Items (MUST VERIFY)

1. **Tenant ID Configuration:**
   - File: `src/config/tenantConfig.ts`
   - Line: `CURRENT_TENANT: 'your_unique_tenant'`
   - ✅ Must be lowercase
   - ✅ Must be unique
   - ✅ Must be descriptive

2. **Database Isolation:**
   - All users have correct `tenant_id`
   - No users from other tenants visible
   - User Management filtered correctly

3. **Credentials Cleared:**
   - No pre-populated API keys
   - No default Agent IDs
   - No hardcoded passwords

## 📊 Verification Commands

### Check Database Tenant Isolation:
```bash
node --input-type=module -e "
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const { data: users } = await supabase
  .from('users')
  .select('email, tenant_id')
  .eq('tenant_id', 'YOUR_TENANT_ID')
  .order('created_at', { ascending: false });

console.log('Users for YOUR_TENANT_ID:', users.length);
if (users.length === 0) {
  console.log('✅ Tenant isolation verified - no existing users');
} else {
  console.log('⚠️ Found', users.length, 'users');
  users.forEach(u => console.log('  -', u.email));
}
"
```

### Check All Tenants:
```bash
node --input-type=module -e "
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const { data: users } = await supabase
  .from('users')
  .select('email, tenant_id')
  .order('created_at', { ascending: false })
  .limit(50);

const byTenant = {};
users.forEach(u => {
  if (!byTenant[u.tenant_id]) byTenant[u.tenant_id] = [];
  byTenant[u.tenant_id].push(u.email);
});

console.log('📊 Users by Tenant:');
Object.keys(byTenant).forEach(tid => {
  console.log(tid.toUpperCase() + ':', byTenant[tid].length, 'users');
});
"
```

## ❌ Common Mistakes to Avoid

1. ❌ Copying tenant_id from existing system
2. ❌ Using uppercase in tenant_id
3. ❌ Forgetting to rebuild after config changes
4. ❌ Skipping browser console verification
5. ❌ Not testing user creation before deployment
6. ❌ Leaving default API credentials
7. ❌ Not verifying database isolation

## ✅ Success Criteria

**Your clone is ready for deployment when:**
- ✅ All checklist items above are completed
- ✅ Browser console shows correct tenant_id
- ✅ Database shows 0 users for new tenant initially
- ✅ First user creation assigns correct tenant_id
- ✅ User Management shows only current tenant users
- ✅ No data from other tenants is visible

---

**Tenant ID:** _____________________ (Fill in your tenant ID)

**Verified By:** _____________________ (Your name)

**Date:** _____________________ (Verification date)

**Status:** [ ] Ready for Deployment / [ ] Needs Fixes
