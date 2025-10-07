# Tenant Management Scripts - Quick Reference

## Available Scripts

### 1. Verify Tenant Configuration
```bash
npm run verify:tenant
```
**Purpose:** Verifies that the tenant configuration is correct after cloning
**Use When:**
- After cloning the repository
- Before first deployment
- To verify tenant ID format and credentials

**Output:**
- Tenant ID validation
- Supabase connection check
- User count for configured tenant
- API credentials verification

---

### 2. Check Tenant Isolation
```bash
npm run check:tenant-isolation
```
**Purpose:** Verifies that each tenant only sees their own users
**Use When:**
- After new user registrations
- To verify no cross-tenant data leaks
- Debugging user visibility issues

**Output:**
- All users grouped by tenant
- Verification of isolation rules
- Detection of misplaced users

**Example Output:**
```
🏢 Tenant: "artlee" (1 users)
   📧 artlee@email.com
      Role: super_user
      Created: 2025-10-04

🏢 Tenant: "carexps" (3 users)
   📧 elmfarrell@yahoo.com
   📧 guest@email.com
   📧 Mahabir

✅ CareXPS isolation is correct
✅ ARTLEE isolation is correct
✅ MedEx isolation is correct
```

---

### 3. Fix Tenant IDs (Interactive)
```bash
npm run fix:tenant-ids
```
**Purpose:** Updates tenant_id values for users created with wrong tenant
**Use When:**
- Users appear in wrong tenant's User Management
- After identifying cross-tenant data leak

**Features:**
- Prompts for confirmation before making changes
- Shows current and target states
- Verifies updates after completion
- Safe for production use

**Workflow:**
1. Shows planned corrections
2. Asks for confirmation (yes/no)
3. Verifies current database state
4. Applies updates if needed
5. Verifies final state

---

### 4. Fix Tenant IDs (Automatic)
```bash
node fix-tenant-ids-auto.js
```
**Purpose:** Same as interactive version but runs automatically
**Use When:**
- Scripting/automation scenarios
- Batch processing
- CI/CD pipelines

**Features:**
- No user prompts
- Automatic execution
- Same verification as interactive version
- Detailed logging

---

## Common Use Cases

### Case 1: New User Registration
**Symptom:** New user doesn't appear in User Management

**Solution:**
```bash
# 1. Check tenant isolation
npm run check:tenant-isolation

# 2. If user has wrong tenant_id, fix it
npm run fix:tenant-ids
```

---

### Case 2: Wrong Users in User Management
**Symptom:** CareXPS shows artlee@email.com or medex@email.com

**Solution:**
```bash
# 1. Clear browser cache and refresh
# 2. If still wrong, check database state
npm run check:tenant-isolation

# 3. If database is wrong, fix it
npm run fix:tenant-ids
```

---

### Case 3: After Deployment
**Best Practice:** Verify tenant isolation after every deployment

```bash
# Verify configuration
npm run verify:tenant

# Check isolation
npm run check:tenant-isolation
```

---

### Case 4: Debugging User Visibility
**Symptom:** User can't see their data or sees wrong data

**Debugging Steps:**
```bash
# 1. Check their tenant_id in database
npm run check:tenant-isolation

# 2. Verify app configuration matches
npm run verify:tenant

# 3. Check browser console for tenant_id in queries
# Look for: .eq('tenant_id', 'expected_tenant')

# 4. Clear browser cache and retry
```

---

## Expected Database State

### ARTLEE Tenant
```
tenant_id = 'artlee'
Users:
- artlee@email.com
```

### CareXPS Tenant
```
tenant_id = 'carexps'
Users:
- elmfarrell@yahoo.com
- guest@email.com
- Mahabir
```

### MedEx Tenant
```
tenant_id = 'medex'
Users:
- medex@email.com
```

---

## Troubleshooting

### Issue: Script fails with "Missing Supabase credentials"
**Solution:**
```bash
# Verify .env.local exists with correct values
cat .env.local | grep SUPABASE
```

### Issue: Database query returns empty results
**Solution:**
- Check Supabase connection in browser
- Verify RLS policies are not blocking service role
- Check if Supabase project is active

### Issue: Users have null tenant_id
**Solution:**
```bash
# Run migration to add default tenant_id
# Contact database admin to run:
# UPDATE users SET tenant_id = 'carexps' WHERE tenant_id IS NULL;
```

---

## Script Files

| File | Purpose | Interactive |
|------|---------|-------------|
| `verify-tenant-isolation.js` | Verify tenant config after clone | Yes |
| `check-tenant-isolation.js` | Check all users by tenant | No |
| `fix-tenant-ids.js` | Fix wrong tenant_id values | Yes |
| `fix-tenant-ids-auto.js` | Fix wrong tenant_id (auto) | No |

---

## Maintenance

### Weekly Check (Recommended)
```bash
npm run check:tenant-isolation
```

### After Each Deployment
```bash
npm run verify:tenant
npm run check:tenant-isolation
```

### Before Database Changes
```bash
# Backup current state
npm run check:tenant-isolation > tenant-state-backup.txt
```

---

*Last Updated: 2025-10-04*
*Tenant Isolation Status: ✅ WORKING CORRECTLY*
