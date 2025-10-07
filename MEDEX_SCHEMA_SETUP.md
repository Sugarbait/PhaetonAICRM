# MedEx Schema Setup Guide

## Overview

This guide explains how to set up a completely separate database schema for MedEx Healthcare CRM while keeping CareXPS data unchanged.

## Architecture

- **CareXPS:** Uses `public` schema (default PostgreSQL schema)
- **MedEx:** Uses `medex` schema (new separate schema)
- **Isolation:** Complete data separation - no shared tables or data

## Setup Instructions

### Step 1: Run the Migration in Supabase

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20251003000001_create_medex_schema.sql`
4. Copy the entire SQL script
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute the migration

### Step 2: Verify the Schema Was Created

Run this query in Supabase SQL Editor:

```sql
-- Check if medex schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'medex';

-- List all tables in medex schema
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'medex'
ORDER BY table_name;

-- Count rows in medex tables (should all be 0)
SELECT
  'medex.users' as table_name, COUNT(*) as row_count FROM medex.users
UNION ALL
SELECT 'medex.user_settings', COUNT(*) FROM medex.user_settings
UNION ALL
SELECT 'medex.audit_logs', COUNT(*) FROM medex.audit_logs
UNION ALL
SELECT 'medex.notes', COUNT(*) FROM medex.notes;
```

**Expected Results:**
- Schema `medex` exists
- All tables are present with identical structure to `public` schema
- All tables have 0 rows (clean slate for MedEx)

### Step 3: Verify CareXPS Is Unaffected

Run this query to confirm CareXPS data remains intact:

```sql
-- Count rows in public schema (CareXPS data)
SELECT
  'public.users' as table_name, COUNT(*) as row_count FROM public.users
UNION ALL
SELECT 'public.user_settings', COUNT(*) FROM public.user_settings
UNION ALL
SELECT 'public.audit_logs', COUNT(*) FROM public.audit_logs
UNION ALL
SELECT 'public.notes', COUNT(*) FROM public.notes;
```

**Expected Results:**
- All CareXPS data is still present
- Row counts match pre-migration numbers
- CareXPS users (guest, Masika, ELM, Pierre) still exist in `public.users`

### Step 4: MedEx App Configuration

The MedEx app has been configured to use the `medex` schema:

**File:** `src/config/supabase.ts`
```typescript
return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  db: {
    schema: 'medex' // 🎯 MedEx uses separate schema
  },
  // ... other config
})
```

This ensures:
- All Supabase queries from MedEx app target `medex` schema
- MedEx sees only its own data
- CareXPS continues using `public` schema (default behavior)

## How It Works

### Schema Isolation

PostgreSQL schemas provide namespace isolation:

```
Supabase Database
├── public schema (CareXPS)
│   ├── users (4 rows: guest, Masika, ELM, Pierre)
│   ├── user_settings
│   ├── audit_logs
│   └── notes
│
└── medex schema (MedEx)
    ├── users (0 rows - brand new)
    ├── user_settings (0 rows)
    ├── audit_logs (0 rows)
    └── notes (0 rows)
```

### Query Behavior

When MedEx app runs a query:
```typescript
// This query
supabase.from('users').select('*')

// Actually queries
SELECT * FROM medex.users  // Not public.users
```

When CareXPS app runs the same query:
```typescript
// This query
supabase.from('users').select('*')

// Queries
SELECT * FROM public.users  // Default schema
```

## Troubleshooting

### Issue: Migration Fails with "schema already exists"

**Solution:** The migration uses `IF NOT EXISTS` - this is safe. If it fails, the schema may already be set up.

Verify with:
```sql
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'medex';
```

### Issue: MedEx still shows CareXPS users

**Possible Causes:**
1. Migration hasn't been run yet - Run the SQL migration in Supabase
2. Browser cache - Clear localStorage and reload
3. Wrong schema in config - Verify `src/config/supabase.ts` has `schema: 'medex'`

**Verification:**
```typescript
// In browser console
console.log('Schema config:', supabase.from('users').schema)
```

### Issue: CareXPS stops working after migration

**This should NOT happen** - CareXPS uses default `public` schema which is unchanged.

If it does happen:
1. Check CareXPS doesn't have `schema: 'medex'` in its config
2. Verify `public` schema tables are intact:
   ```sql
   SELECT * FROM public.users;
   ```

## Testing Schema Isolation

### Test 1: Create MedEx User

In MedEx app (browser console):
```typescript
const { data, error } = await supabase
  .from('users')
  .insert({
    id: 'test-medex-user-001',
    email: 'medex-test@example.com',
    role: 'user'
  })

console.log('Created user:', data)
```

Verify in Supabase SQL Editor:
```sql
-- Check MedEx schema (should have 1 user)
SELECT * FROM medex.users WHERE email = 'medex-test@example.com';

-- Check CareXPS schema (should NOT have this user)
SELECT * FROM public.users WHERE email = 'medex-test@example.com';
```

### Test 2: Verify CareXPS Users Not Visible in MedEx

In MedEx app:
```typescript
const { data: users } = await supabase.from('users').select('*')
console.log('MedEx users:', users)
// Should NOT include: guest, Masika, ELM, Pierre
```

### Test 3: Verify CareXPS Still Works

In CareXPS app:
```typescript
const { data: users } = await supabase.from('users').select('*')
console.log('CareXPS users:', users)
// Should include: guest, Masika, ELM, Pierre (unaffected)
```

## Rollback (if needed)

To remove the medex schema:

```sql
-- WARNING: This deletes all MedEx data permanently
DROP SCHEMA medex CASCADE;
```

To restore CareXPS access to MedEx app:

In `src/config/supabase.ts`, remove the schema configuration:
```typescript
return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  // Remove this:
  // db: { schema: 'medex' },

  auth: {
    // ... rest of config
  }
})
```

## Production Deployment

When deploying MedEx to production:

1. **GitHub Workflow:** No changes needed - schema is configured in code
2. **Environment Variables:** Same Supabase project URL and keys
3. **Database Migration:** Run the SQL migration in production Supabase project
4. **Verification:** Use the test queries above to confirm isolation

## Benefits of This Approach

✅ **Complete Data Isolation** - MedEx and CareXPS cannot see each other's data
✅ **Same Supabase Project** - No additional costs or management overhead
✅ **Zero Impact on CareXPS** - Existing app continues working unchanged
✅ **Easy Rollback** - Simple to remove if needed
✅ **HIPAA Compliant** - Each tenant's PHI is completely separated
✅ **Performance** - No query overhead (schema lookup is instant)
✅ **Maintenance** - Both apps use same codebase with one config difference

## Next Steps

1. ✅ Run the migration SQL in Supabase
2. ✅ Verify schema was created and is empty
3. ✅ Verify CareXPS data is intact
4. ✅ Test MedEx app - should show 0 users
5. ✅ Create first MedEx user
6. ✅ Verify isolation with test queries

---

**Created:** 2025-10-03
**Version:** 1.0
**Contact:** For issues, check CLAUDE.md or consult database administrator
