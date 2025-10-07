# CareXPS Super User Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing super user functionality in your CareXPS Healthcare CRM. The implementation includes:

1. **Super User Setup** - Making elmfarrell@yahoo.com and pierre@phaetonai.com Super Users
2. **Profile Name Persistence** - Fixing issues where profile names revert on page refresh
3. **API Key Persistence** - Ensuring Retell API keys persist between sessions and page navigation
4. **Profile Status Management** - New profiles disabled by default with enable/disable functionality

## 🚀 Quick Start

### Step 1: Apply Database Migration

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your CareXPS project

2. **Run the Migration**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"
   - Copy the entire contents of `supabase-comprehensive-user-management-migration.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

### Step 2: Verify Setup (Optional but Recommended)

```bash
# Install dependencies (if not already installed)
npm install @supabase/supabase-js dotenv

# Run the test script
node test-super-user-setup.js
```

### Step 3: Update Your Application Code

Update your authentication and user management components to use the new enhanced service:

```typescript
import { enhancedUserService } from '@/services/enhancedUserService'

// Example: Get complete user profile with persistence data
const userProfile = await enhancedUserService.getCompleteUserProfile(userId)
```

## 📊 What's Implemented

### ✅ Database Schema Enhancements

1. **Enhanced Users Table**
   - `is_super_user` - Boolean flag for super user status
   - `is_enabled` - Profile enable/disable status
   - `profile_status` - Detailed status (enabled/disabled/suspended/pending)
   - `super_user_granted_at` - Timestamp of super user grant
   - `super_user_granted_by` - Who granted super user privileges

2. **New User Profiles Table**
   - Extended profile information
   - API key storage (encrypted)
   - Login tracking
   - Account status management

3. **Enhanced User Settings Table**
   - `profile_name` - Persistent profile name storage
   - `encrypted_api_keys` - Secure API key storage
   - `settings_version` - Version control for conflict resolution
   - `sync_status` - Synchronization status tracking

4. **Super User Permissions Table**
   - Granular permission management
   - Permission types: user_management, system_settings, audit_access, etc.
   - Expiration and audit tracking

5. **User Audit Log Table**
   - Comprehensive user management action logging
   - HIPAA-compliant audit trail

### ✅ Super User Privileges

Both specified email addresses are configured as Super Users with full privileges:

- **elmfarrell@yahoo.com** (ID: `super-user-elm-farrell`)
- **pierre@phaetonai.com** (ID: `super-user-pierre-phaeton`)

**Super User Capabilities:**
- View and manage all user accounts
- Enable/disable user profiles
- Grant/revoke super user privileges
- Access comprehensive audit logs
- Manage system settings
- Export user data

### ✅ Data Persistence Fixes

1. **Profile Name Persistence**
   - Profile names stored in multiple locations for redundancy
   - Automatic sync between users and user_settings tables
   - Version control prevents data loss during concurrent updates

2. **API Key Persistence**
   - Retell API keys encrypted and stored securely
   - Agent IDs preserved across sessions
   - Automatic restoration on login

3. **Settings Synchronization**
   - Cross-device setting sync with conflict resolution
   - Version-based conflict detection
   - Safe update functions prevent data corruption

### ✅ Enhanced Security Features

1. **Row Level Security (RLS) Policies**
   - Super users can access all user data
   - Regular users limited to their own data
   - Guest and demo user exceptions

2. **Comprehensive Audit Logging**
   - All user management actions logged
   - HIPAA-compliant audit trail
   - IP address and user agent tracking

3. **Encrypted Data Storage**
   - API keys encrypted at rest
   - Sensitive profile information protected
   - Audit logs secured

## 🔧 Configuration Details

### Environment Variables

Ensure these variables are set in your `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database Functions Created

1. **`grant_super_user_privileges(user_id, granted_by, permissions[])`**
   - Atomically grants super user status and permissions

2. **`revoke_super_user_privileges(user_id, revoked_by)`**
   - Revokes super user status and deactivates permissions

3. **`set_user_profile_status(user_id, enabled, reason, performed_by)`**
   - Enables or disables user profiles with audit logging

4. **`update_user_settings_safe(user_id, settings, client_version)`**
   - Conflict-safe settings updates with version control

### Views Created

1. **`user_management_view`**
   - Comprehensive view combining user, profile, and settings data
   - Includes super user permissions as JSON array
   - Optimized for user management operations

## 🛠️ API Usage Examples

### Check Super User Status

```typescript
const profile = await enhancedUserService.getCompleteUserProfile(userId)
if (profile.data?.is_super_user) {
  // User has super user privileges
  console.log('Super User Permissions:', profile.data.super_user_permissions)
}
```

### Update Profile with Persistence

```typescript
// Profile name will persist across page refreshes
await enhancedUserService.updateUserProfile(userId, {
  name: 'New Profile Name',
  first_name: 'John',
  last_name: 'Doe',
  department: 'Healthcare'
})
```

### Update API Keys with Persistence

```typescript
// API keys will be encrypted and persist across sessions
await enhancedUserService.updateUserApiKeys(userId, {
  retell_api_key: 'your-api-key',
  call_agent_id: 'agent-123',
  sms_agent_id: 'sms-456'
})
```

### Manage User Status (Super Users Only)

```typescript
// Enable a user profile
await enhancedUserService.setUserProfileStatus(
  userId,
  true, // enabled
  'Approved by admin', // reason
  currentUserId // performed by
)

// Disable a user profile
await enhancedUserService.setUserProfileStatus(
  userId,
  false, // disabled
  'Policy violation', // reason
  currentUserId // performed by
)
```

### Grant Super User Privileges

```typescript
await enhancedUserService.grantSuperUserPrivileges(
  userId,
  currentUserId, // granted by
  ['user_management', 'system_settings', 'audit_access'] // permissions
)
```

## 🧪 Testing Your Implementation

### Manual Testing Steps

1. **Test Super User Login**
   ```
   Email: elmfarrell@yahoo.com
   Password: [Your configured password]
   ```

2. **Test Profile Name Persistence**
   - Login as super user
   - Go to user profile/settings
   - Change profile name
   - Refresh page → Name should persist

3. **Test API Key Persistence**
   - Set Retell API key and agent IDs
   - Navigate to different pages
   - Return to settings → Keys should be preserved

4. **Test User Management**
   - Create a new user → Should be disabled by default
   - Enable/disable users as super user
   - Grant super user privileges to another user

### Automated Testing

Run the comprehensive test suite:

```bash
node test-super-user-setup.js
```

Expected output for successful setup:
```
✅ OVERALL STATUS: SUCCESS
🎉 All systems ready! Super user functionality is working correctly.
```

## 🔒 Security Considerations

### Data Protection

1. **Encryption at Rest**
   - API keys encrypted using AES-256-GCM
   - Sensitive profile data protected
   - Database-level encryption for audit logs

2. **Access Control**
   - RLS policies enforce data isolation
   - Super user permissions validated server-side
   - Audit logging for all privileged actions

3. **Session Security**
   - Secure session management
   - Automatic logout on privilege changes
   - Cross-device session synchronization

### Compliance Features

1. **HIPAA Compliance**
   - Comprehensive audit trails
   - PHI data encryption
   - Access logging and monitoring

2. **Data Retention**
   - Audit log retention policies
   - User data cleanup procedures
   - Backup and recovery processes

## 🐛 Troubleshooting

### Common Issues

1. **Migration Fails**
   ```sql
   -- Check if enum type exists
   SELECT * FROM pg_enum WHERE enumlabel = 'super_user';

   -- If not, create manually:
   ALTER TYPE user_role ADD VALUE 'super_user';
   ```

2. **RLS Policy Errors**
   ```sql
   -- Check current policies
   SELECT * FROM pg_policies WHERE tablename = 'users';

   -- Disable RLS temporarily if needed
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ```

3. **Function Not Found Errors**
   ```sql
   -- Check if functions exist
   SELECT * FROM pg_proc WHERE proname LIKE '%super_user%';
   ```

### Debug Information

Enable debug logging in your application:

```typescript
// Add to your app initialization
console.log('Debug: Super user service loaded')
window.debugSuperUser = enhancedUserService // For console testing
```

## 📚 Additional Resources

### Database Schema

- View the complete schema in `supabase-comprehensive-user-management-migration.sql`
- All tables include proper indexes for performance
- RLS policies documented inline

### Service Architecture

- Enhanced user service in `src/services/enhancedUserService.ts`
- Backward compatible with existing code
- Comprehensive error handling and logging

### Testing Framework

- Automated tests in `test-super-user-setup.js`
- Manual testing procedures documented above
- Performance benchmarks included

## 🎯 Next Steps

1. **Apply the migration** using Supabase SQL Editor
2. **Run the test script** to verify setup
3. **Update your application** to use enhanced services
4. **Test super user functionality** with the specified accounts
5. **Monitor audit logs** for security compliance

---

## Summary of Deliverables

✅ **Database Migration**: `supabase-comprehensive-user-management-migration.sql`
- Complete schema enhancements
- Super user setup for specified emails
- Data persistence fixes
- Enhanced RLS policies

✅ **Enhanced Service**: `src/services/enhancedUserService.ts`
- Comprehensive user management API
- Profile and API key persistence
- Super user privilege management
- Conflict resolution for settings

✅ **Test Suite**: `test-super-user-setup.js`
- Automated verification of setup
- Database connectivity testing
- Super user privilege validation
- Settings persistence verification

✅ **Implementation Guide**: This document
- Step-by-step setup instructions
- API usage examples
- Security considerations
- Troubleshooting guide

The implementation provides a robust, secure, and scalable user management system with full super user capabilities while fixing the data persistence issues you experienced.