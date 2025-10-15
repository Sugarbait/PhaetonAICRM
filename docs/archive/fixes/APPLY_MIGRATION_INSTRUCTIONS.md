# Apply Login Fix Migration

## Quick Instructions

The login issue has been diagnosed and the fix is ready. Follow these steps to apply it:

### Method 1: Supabase Dashboard SQL Editor (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Login to your account
   - Select your project: `cpkslvmydfdevdftieck`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query" button

3. **Copy the Migration SQL**
   - Open the file: `supabase/migrations/20251010000002_fix_login_rls_policy.sql`
   - Copy ALL the SQL content

4. **Paste and Run**
   - Paste the SQL into the SQL Editor
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for success message

5. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check for any error messages (there should be none)

### Method 2: Using psql (if you have PostgreSQL client)

```bash
# Get your database connection string from Supabase Dashboard → Project Settings → Database
# It looks like: postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres

psql "your-connection-string" < supabase/migrations/20251010000002_fix_login_rls_policy.sql
```

### Method 3: Supabase CLI (if installed)

```bash
supabase migration up
```

---

## What This Migration Does

### Problem
- RLS policies were blocking unauthenticated SELECT queries
- Users couldn't login because `getUserByEmail()` failed
- Error: "User not found in any storage"

### Solution
- Creates new RLS policy: `allow_login_and_authenticated_queries`
- Allows `auth.uid() IS NULL` for unauthenticated login queries
- Maintains security for all write operations

### Security Guarantees
- ✅ Passwords are NOT in the users table (encrypted in user_profiles)
- ✅ Only basic info exposed: email, role, isActive, tenant_id
- ✅ Write operations (INSERT/UPDATE/DELETE) still require authentication
- ✅ Standard practice for database-only authentication systems

---

## Testing the Fix

After applying the migration:

1. **Clear Browser Cache**
   ```
   - Open Developer Console (F12)
   - Right-click Refresh button → "Empty Cache and Hard Reload"
   - Or: Settings → Clear browsing data → Cached images and files
   ```

2. **Clear localStorage**
   ```javascript
   // In browser console:
   localStorage.clear()
   sessionStorage.clear()
   ```

3. **Test Login**
   - Go to http://localhost:3000
   - Try logging in with test@test.com
   - Check browser console for logs

4. **Expected Console Output**
   ```
   ✅ UserProfileService: User found in Supabase
   ✅ Authentication successful
   ✅ User logged in successfully
   ```

---

## Verification Checklist

After migration, verify:

- [ ] Migration ran without errors in SQL Editor
- [ ] Can login with existing user (test@test.com)
- [ ] Can create new user profile
- [ ] Can approve new user (if super user)
- [ ] Approved user can login successfully
- [ ] Console shows "User found in Supabase" (not "User not found")

---

## Rollback (if needed)

If you need to rollback, run this SQL:

```sql
-- Rollback to restrictive policies (will break login again)
DROP POLICY IF EXISTS "allow_login_and_authenticated_queries" ON users;

CREATE POLICY "users_can_see_own_profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "super_users_can_see_all_users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users current_user
      WHERE current_user.id = auth.uid()
      AND current_user.role = 'super_user'
      AND current_user.is_active = true
    )
  );
```

---

## Need Help?

If you encounter issues:

1. **Check Supabase logs**: Dashboard → Logs → Select "Postgres Logs"
2. **Verify RLS is enabled**: Table Editor → users table → "Enable RLS" should be ON
3. **Check policy exists**: SQL Editor → Run:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```
4. **Verify service role key**: Check `.env.local` has correct `VITE_SUPABASE_SERVICE_ROLE_KEY`

---

## File Locations

- **Migration SQL**: `supabase/migrations/20251010000002_fix_login_rls_policy.sql`
- **Diagnosis Report**: `LOGIN_ISSUE_DIAGNOSIS.md`
- **This File**: `APPLY_MIGRATION_INSTRUCTIONS.md`
