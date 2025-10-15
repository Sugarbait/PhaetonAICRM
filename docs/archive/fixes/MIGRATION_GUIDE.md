# API Credential Columns Migration Guide

## Summary

The `user_settings` table is missing 3 columns needed to store Retell AI API credentials. This migration adds them.

## Required Columns

1. `retell_api_key` - TEXT - Stores Retell AI API key
2. `call_agent_id` - TEXT - Stores Retell AI Call Agent ID
3. `sms_agent_id` - TEXT - Stores Retell AI SMS Agent ID

## Migration Status

**Status:** ❌ NOT YET APPLIED

Run `node run-migration.js` to check current status.

## How to Apply Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/sql/new

2. **Paste this SQL:**
   ```sql
   ALTER TABLE user_settings
   ADD COLUMN IF NOT EXISTS retell_api_key TEXT,
   ADD COLUMN IF NOT EXISTS call_agent_id TEXT,
   ADD COLUMN IF NOT EXISTS sms_agent_id TEXT;
   ```

3. **Click "RUN"**

4. **Verify:**
   ```bash
   node run-migration.js
   ```

   Should show: ✅ Columns already exist!

### Option 2: Using psql (Advanced)

If you have PostgreSQL client installed:

```bash
# Extract connection string from .env.local
# Then run:
psql "your-connection-string" -c "ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS retell_api_key TEXT, ADD COLUMN IF NOT EXISTS call_agent_id TEXT, ADD COLUMN IF NOT EXISTS sms_agent_id TEXT;"
```

## Verification

After applying the migration, verify it worked:

```bash
node run-migration.js
```

**Expected output:**
```
✅ Columns already exist! Migration not needed.
   - retell_api_key (TEXT)
   - call_agent_id (TEXT)
   - sms_agent_id (TEXT)

🎉 API credential columns are ready to use.
```

## Impact

**Before migration:**
- API credentials saved to `user_settings` fail silently
- Credentials don't persist across sessions
- Users must re-enter credentials after every login

**After migration:**
- API credentials save successfully to Supabase
- Credentials persist across sessions and devices
- One-time configuration, works everywhere

## Files

- **Migration SQL:** `I:\Apps Back Up\ARTLEE CRM\supabase\migrations\20251006000001_add_api_credentials_to_user_settings.sql`
- **Verification Script:** `I:\Apps Back Up\ARTLEE CRM\run-migration.js`
- **This Guide:** `I:\Apps Back Up\ARTLEE CRM\MIGRATION_GUIDE.md`

## Rollback (if needed)

If you need to remove these columns:

```sql
ALTER TABLE user_settings
DROP COLUMN IF EXISTS retell_api_key,
DROP COLUMN IF EXISTS call_agent_id,
DROP COLUMN IF EXISTS sms_agent_id;
```

## Next Steps

After successful migration:

1. ✅ Test saving API credentials in Settings
2. ✅ Verify credentials persist after page refresh
3. ✅ Verify credentials sync across devices
4. ✅ Update MIGRATION_GUIDE.md status to "APPLIED"
