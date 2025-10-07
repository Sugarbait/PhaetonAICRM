# Test User Cleanup Guide

This guide explains how to safely clean up test profiles and fake users from the CareXPS User Management Dashboard.

## 🎯 Overview

The Test User Cleanup system automatically identifies and safely removes test/fake user profiles while protecting legitimate accounts. It includes:

- **Pattern-based identification** of test users
- **Automatic backup creation** before any deletions
- **Protected user detection** to prevent accidental deletion of important accounts
- **Rollback capability** if needed

## 🔍 What Gets Identified as Test Users

The system looks for these patterns to identify test users:

### ✅ Safe to Delete Patterns
- Email addresses starting with: `test@`, `testing@`, `fake@`, `dummy@`, `example@`
- Email domains: `@test.`, `@example.`
- Names like: "Test User", "John Doe", "Jane Doe", "Fake User", "Dummy User"
- Names containing "contactus"
- Any email/name containing "test...test" pattern

### 🛡️ Protected Patterns (NEVER Deleted)
- `elmfarrell@yahoo.com` (Dr. Farrell)
- `pierre@phaetonai.com` (Pierre)
- `demo@carexps.com` (Demo user)
- `guest@email.com` (Guest user)
- Any `@carexps.com` domain emails

## 🚀 How to Use

### Method 1: User Management Dashboard (Recommended)

1. **Navigate to User Management**
   - Go to Settings → User Management
   - Ensure you're logged in as a Super User

2. **Analyze Test Users**
   - Click the "Analyze Test Users" button
   - Review the analysis results showing:
     - Total users found
     - Test users identified
     - Protected users that won't be touched

3. **Clean Up Test Users**
   - Click the "Clean Up Test Users" button
   - Confirm the cleanup operation
   - The system will:
     - Create an automatic backup
     - Delete identified test users
     - Show a detailed results summary

4. **Manage Backups** (if needed)
   - Click "Manage Backups" to view available backups
   - Use browser console to restore if needed

### Method 2: Browser Console (Advanced)

If you need direct access, you can use the browser console:

```javascript
// Analyze users without making changes
const analysis = await TestUserCleanup.analyzeUsers()
console.log(analysis)

// Perform a dry run (preview only)
const dryRun = await TestUserCleanup.cleanupTestUsers({ dryRun: true })
console.log(dryRun)

// Perform actual cleanup with backup
const cleanup = await TestUserCleanup.cleanupTestUsers({
  dryRun: false,
  createBackup: true
})
console.log(cleanup)

// List available backups
const backups = TestUserCleanup.listBackups()
console.log(backups)

// Restore from backup (replace 'backupKey' with actual key)
await TestUserCleanup.restoreFromBackup('userBackup_2024-01-01T00-00-00-000Z')
```

## 🔄 Backup & Restore

### Automatic Backups
- Created before any deletions
- Stored in localStorage with timestamp
- Include complete user data and count

### Manual Restore Process
1. Go to User Management → "Manage Backups"
2. Note the backup key you want to restore
3. Open browser console (F12)
4. Run: `TestUserCleanup.restoreFromBackup('your-backup-key')`
5. Refresh the page to see restored users

## ⚠️ Safety Features

### Multiple Safety Layers
1. **Pattern Matching**: Only obvious test patterns are identified
2. **Protected Lists**: Important accounts are hardcoded as protected
3. **Backup Creation**: Automatic backup before any changes
4. **Confirmation Steps**: User must confirm cleanup operations
5. **Audit Logging**: All operations are logged for security

### What Gets Preserved
- All legitimate user accounts
- Protected system accounts (Dr. Farrell, Pierre, etc.)
- Any accounts not matching obvious test patterns
- Users with custom preserve patterns (if specified)

## 📊 Results Interpretation

After cleanup, you'll see:
- **Identified**: Total test users found
- **Deleted**: Successfully removed users
- **Preserved**: Users that were kept (protected or user-skipped)
- **Errors**: Any issues encountered
- **Backup**: Reference to created backup

## 🔧 Troubleshooting

### If Cleanup Fails
1. Check browser console for detailed error messages
2. Ensure you have Super User permissions
3. Try analyzing first before cleanup
4. Contact system administrator if issues persist

### If Wrong Users Were Deleted
1. Use "Manage Backups" to find recent backup
2. Restore using browser console command
3. Refresh the page to see restored users
4. Consider adjusting patterns before retrying

### If Protected Users Appear in Analysis
This is normal - they're identified but marked as protected and won't be deleted.

## 📝 Example Scenarios

### Scenario 1: Clean Demo Data
After setting up demo accounts for testing, remove them safely:
```
Test users found: 5
- test@example.com (Test User)
- john.doe@test.com (John Doe)
- fake@dummy.com (Fake User)
- testing@test.org (Testing Account)
- contactus@example.com (Contact Us)

Protected users: 3
- elmfarrell@yahoo.com (Dr. Farrell) - PROTECTED
- pierre@phaetonai.com (Pierre) - PROTECTED
- demo@carexps.com (Demo User) - PROTECTED
```

### Scenario 2: After Import Error
If user import created duplicates or test accounts:
```
Analysis Results:
Total Users: 25
Test Users Found: 8
Legitimate Users: 14
Protected Users: 3

Cleanup Result:
Deleted: 8 test users
Preserved: 17 legitimate + protected users
```

## 💡 Best Practices

1. **Always analyze first** before cleaning up
2. **Review the results** carefully before confirming
3. **Keep backups** for at least a few days after cleanup
4. **Test on staging** environment first if possible
5. **Document any custom patterns** you add
6. **Run during low-usage periods** to minimize disruption

## 🔗 Integration

The cleanup system integrates with:
- **User Management Service**: For user operations
- **Audit Logger**: For security logging
- **Encryption Service**: For secure credential handling
- **Local Storage**: For backup and user data

---

**⚠️ Important**: This tool is designed to be conservative and safe. It will only delete obviously fake/test accounts. When in doubt, it preserves accounts rather than risk deleting legitimate users.