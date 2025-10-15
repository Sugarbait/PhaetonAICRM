# CareXPS Database Schema Issues Analysis

## Current Status
The Supabase database instance has existing tables that do NOT match the CareXPS application's expected schema. This is causing 400/406 HTTP errors and preventing proper database synchronization.

## Problem Summary

### 1. Audit Logs Table (Fixed)
**Status**: ✅ RESOLVED
- **Issue**: Missing `severity` column causing 400 errors
- **Solution**: Modified `auditLogger.ts` to work with existing table structure
- **Details**: The audit_logs table exists but has different column names than expected

### 2. Users Table (MAJOR ISSUE)
**Status**: 🚨 CRITICAL - Schema Mismatch
- **Current Schema** (Wrong for CareXPS):
  ```sql
  users {
    id: UUID
    company_id: UUID (nullable)
    username: TEXT (required) -- NOT USED IN CAREXPS
    email: TEXT
    password_hash: TEXT -- NOT USED IN CAREXPS
    role: TEXT ("Admin", "User", etc.) -- Different values
    phi_access_level: TEXT -- NOT USED IN CAREXPS
    totp_secret: TEXT -- NOT USED IN CAREXPS
    is_mfa_enabled: BOOLEAN
    failed_login_attempts: INTEGER -- NOT USED IN CAREXPS
    locked_until: TIMESTAMP -- NOT USED IN CAREXPS
    training_completed: BOOLEAN -- NOT USED IN CAREXPS
    first_name: TEXT -- NOT USED IN CAREXPS
    last_name: TEXT -- NOT USED IN CAREXPS
    phone: TEXT -- NOT USED IN CAREXPS
    ... (many other fields)
  }
  ```

- **Expected Schema** (CareXPS):
  ```sql
  users {
    id: UUID
    azure_ad_id: TEXT (UNIQUE, required) -- MISSING
    email: TEXT
    name: TEXT (required) -- MISSING
    role: ENUM ('admin', 'healthcare_provider', 'staff', 'super_user')
    mfa_enabled: BOOLEAN
    avatar_url: TEXT -- MISSING
    last_login: TIMESTAMP -- MISSING
    is_active: BOOLEAN
    metadata: JSONB -- MISSING
    created_at: TIMESTAMP
    updated_at: TIMESTAMP
  }
  ```

### 3. User Profiles Table (EXISTS but Empty)
**Status**: ✅ EXISTS - Schema appears correct
- The `user_profiles` table exists and is accessible
- Appears to have correct schema based on successful API access

### 4. User Settings Table (EXISTS)
**Status**: ✅ EXISTS - Schema needs verification
- The `user_settings` table exists in API listing
- Schema compatibility needs verification

## Impact on Application

### Current Behavior
1. **Database Sync Disabled**: Application falls back to localStorage-only mode
2. **Cross-device Sync Broken**: No real-time synchronization between devices
3. **Audit Logging Partially Working**: Basic audit entries stored with limited data
4. **User Management Broken**: Cannot query users table with expected fields

### Error Messages Seen
- `POST audit_logs 400: "Could not find the 'severity' column"` (FIXED)
- `GET user_profiles 400: Bad Request on user_id queries` (EXISTS - may be RLS issue)
- `GET users 406: Not Acceptable errors` (SCHEMA MISMATCH)

## Solutions

### Option 1: Database Migration (RECOMMENDED)
Create new tables or alter existing ones to match CareXPS schema:

```sql
-- Backup existing users table
CREATE TABLE users_backup AS SELECT * FROM users;

-- Drop and recreate users table with correct schema
DROP TABLE users CASCADE;
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  azure_ad_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'healthcare_provider', 'staff', 'super_user')),
  mfa_enabled BOOLEAN DEFAULT false,
  avatar_url TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add missing columns to audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS source_ip TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS additional_info JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS phi_accessed BOOLEAN DEFAULT false;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'INFO';
```

### Option 2: Application Adaptation (TEMPORARY)
Modify CareXPS application to work with existing schema:

1. **Map existing fields**:
   - `username` → `name`
   - Create synthetic `azure_ad_id` from email
   - Map role values

2. **Ignore missing fields**:
   - Skip `metadata`, `avatar_url` temporarily
   - Use `email` as primary identifier

### Option 3: Separate Database (CLEAN SLATE)
Create a new Supabase project specifically for CareXPS with correct schema from start.

## Recommended Action Plan

### Phase 1: Immediate Fixes (DONE)
- ✅ Fix audit logger to work with existing table
- ✅ Document all schema mismatches

### Phase 2: Enable Basic Functionality
1. Temporarily adapt userProfileService to work with existing users table
2. Map existing fields to expected format
3. Test basic user authentication and profile loading

### Phase 3: Full Migration (Future)
1. Plan database migration strategy
2. Backup existing data
3. Execute schema migration
4. Update application code
5. Test thoroughly

## Files Modified
1. `src/services/auditLogger.ts` - Fixed to work with existing audit_logs schema
2. `DATABASE_ISSUES_ANALYSIS.md` - This analysis document
3. `database_schema_setup.sql` - Complete correct schema for future migration

## Next Steps
1. Create temporary fix for userProfileService
2. Test application with localStorage fallback working correctly
3. Plan proper database migration
4. Update TypeScript types to match actual database

---
*Analysis completed: September 24, 2025*