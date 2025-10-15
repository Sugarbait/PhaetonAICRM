# ARTLEE CRM - Quick Fix Guide

## 🚀 5-Minute Fix Procedure

Follow these steps in order to fix your Supabase database issues.

## Prerequisites

- Node.js 18+ installed
- Supabase dashboard access
- `.env.local` file configured with Supabase credentials

## Step 1: Test Connection (1 minute)

```bash
# Install dependencies if needed
npm install @supabase/supabase-js

# Run connection test
node test-supabase-connection.mjs
```

**Expected output:**
- ✅ marks = working
- ❌ marks = needs fixing

**If all tests pass:** Your database is fine, skip to Step 4.

**If tests fail:** Continue to Step 2.

## Step 2: Run Database Fixes (2 minutes)

### Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your ARTLEE project
3. Click "SQL Editor" in left sidebar

### Run Fix Script
1. Open `migration/FIX_406_400_ERRORS.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Wait for all queries to complete
6. Check for any error messages

**Expected result:**
- All queries should complete successfully
- You should see NOTICE messages like "Users table accessible: 0 rows"
- Final verification should show all tables with proper permissions

## Step 3: Verify Fix (1 minute)

```bash
# Run connection test again
node test-supabase-connection.mjs
```

**Expected output:** All ✅ marks

If you still see ❌ marks, run the content-type fix:

1. Open `migration/FIX_CONTENT_TYPE_406.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run"

## Step 4: Test Application (1 minute)

```bash
# Start the application
npm run dev
```

1. Open browser to http://localhost:3000
2. Try to register a new user (first user becomes super_user)
3. Check browser console for errors
4. Verify login works

## Common Issues and Quick Fixes

### Issue: "Cannot find module '@supabase/supabase-js'"

```bash
npm install @supabase/supabase-js
```

### Issue: "Missing environment variables"

Check `.env.local` file exists with:
```env
VITE_SUPABASE_URL=https://fslniuhyunzlfcbxsiol.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Issue: Still getting 406 errors

Run this in Supabase SQL Editor:
```sql
-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verify permissions
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND grantee = 'anon';
```

Should show: SELECT, INSERT, UPDATE, DELETE

### Issue: Still getting 400 errors

Check browser Network tab for exact error message.

Common causes:
- Missing `tenant_id` in query
- Missing required column in INSERT
- Type mismatch (sending string for integer)

## Verification Checklist

After fixes, verify these are working:

- [ ] `node test-supabase-connection.mjs` shows all ✅
- [ ] Can register new user in application
- [ ] Can login with credentials
- [ ] Can see Settings page
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 responses (not 406/400)

## Next Steps

Once database is working:

1. **Create First User** (becomes super_user automatically)
2. **Configure Settings** → Set company name, API keys
3. **Create Additional Users** → Settings → User Management
4. **Test All Features** → Calls, SMS, Dashboard

## Need More Help?

See detailed guides:
- `SUPABASE_FIX_SUMMARY.md` - Complete fix documentation
- `TROUBLESHOOTING_GUIDE.md` - Detailed troubleshooting
- `migration/DIAGNOSTIC_QUERIES.sql` - Database diagnostics

## Emergency Reset

If nothing works, run this in Supabase SQL Editor:

```sql
-- DISABLE RLS (for testing only)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Reload schema
NOTIFY pgrst, 'reload schema';
```

⚠️ **WARNING:** This disables security. Only use for debugging.

## Success Indicators

You know the fix worked when:
- ✅ Connection test shows all green
- ✅ Can register and login to app
- ✅ Browser console is clean (no errors)
- ✅ Network tab shows 200 responses
- ✅ Data appears in Supabase dashboard

## Summary

1. **Test:** `node test-supabase-connection.mjs`
2. **Fix:** Run `FIX_406_400_ERRORS.sql` in Supabase SQL Editor
3. **Verify:** Run test again, should show all ✅
4. **Use:** Start app with `npm run dev`, register user, login

Total time: ~5 minutes

**Most Important:** Always include `tenant_id = 'artlee'` in all database queries!
