# Azure Email Service Deployment Guide

## Overview

This guide provides step-by-step instructions for fixing and deploying the email notification system in Azure Static Web Apps for the CareXPS Healthcare CRM.

## Problem Analysis

The email notifications were failing in Azure environment with 503 errors due to:

1. **Missing Environment Variables**: `HOSTINGER_EMAIL_PASSWORD` not configured in Azure
2. **CORS Issues**: Azure Functions lacked proper CORS headers
3. **Endpoint Detection**: Frontend service couldn't properly detect Azure vs localhost environment
4. **Error Handling**: Poor error messages made debugging difficult

## Solution Implementation

### 1. Fixed Azure Functions

#### Updated `api/send-notification-email/index.js`:
- ✅ Added comprehensive CORS handling for OPTIONS preflight requests
- ✅ Added fallback environment variable support (`EMAIL_PASSWORD` as backup)
- ✅ Enhanced error logging with environment debugging info
- ✅ Added proper CORS headers to all responses
- ✅ Improved credential validation logic

#### Created `api/test-email/index.js`:
- ✅ New Azure Function for testing email functionality
- ✅ Simplified test email with environment diagnostics
- ✅ Same CORS and error handling as main email function
- ✅ Detailed logging for troubleshooting

### 2. Updated Frontend Service

#### Modified `src/services/emailNotificationService.ts`:
- ✅ Fixed environment detection logic for Azure vs localhost
- ✅ Added comprehensive debugging logs
- ✅ Enhanced error handling with detailed response information
- ✅ Updated both notification and test email functions

### 3. Azure Configuration Files

#### Created `.env.azure.example`:
- ✅ Complete Azure environment variable documentation
- ✅ Step-by-step Azure Portal configuration instructions
- ✅ Troubleshooting guide for common issues

## Deployment Steps

### Step 1: Deploy Code Changes

1. **Commit and push all changes**:
   ```bash
   git add .
   git commit -m "Fix Azure email service: Add CORS, environment detection, and debugging"
   git push origin main
   ```

2. **Verify Azure deployment**: Azure Static Web Apps will automatically deploy from your main branch.

### Step 2: Configure Environment Variables in Azure

1. **Access Azure Portal**:
   - Go to https://portal.azure.com
   - Navigate to your CareXPS Static Web App resource

2. **Add Environment Variables**:
   - Click "Configuration" in the left sidebar
   - Under "Application settings", click "+ Add"
   - Add these variables:

   ```
   Name: HOSTINGER_EMAIL_PASSWORD
   Value: [your actual Hostinger email password]

   Name: EMAIL_PASSWORD
   Value: [your actual Hostinger email password] (backup)
   ```

3. **Save Configuration**:
   - Click "Save" to apply changes
   - Azure Functions will restart automatically

### Step 3: Test the Email Service

#### Option 1: Using Browser Console
1. Open your deployed app in browser
2. Open Developer Console (F12)
3. Run test command:
   ```javascript
   sendQuickTestEmail('your-email@example.com')
   ```

#### Option 2: Using Settings Page
1. Navigate to Settings → Email Notifications
2. Configure recipient emails
3. Click "Send Test Email"

### Step 4: Verify Production Environment

Check console logs for environment detection:
```javascript
// Should show in console:
📧 Environment info: {
  hostname: "your-domain.azurestaticapps.net",
  isProduction: true,
  hasViteEmailUrl: false,
  endpoint: "/api/send-notification-email"
}
```

## Troubleshooting

### 503 Service Unavailable Error

**Cause**: Environment variables not configured in Azure

**Solution**:
1. Verify `HOSTINGER_EMAIL_PASSWORD` is set in Azure Portal
2. Check Azure Function logs in Application Insights
3. Test with: `sendQuickTestEmail('test@example.com')`

### CORS Errors

**Cause**: Browser blocking cross-origin requests

**Solution**:
- ✅ Already fixed with proper CORS headers in Azure Functions
- Verify requests are going to relative path `/api/send-notification-email`

### Email Not Sending

**Possible Causes & Solutions**:

1. **SMTP Credentials Wrong**:
   - Verify Hostinger email password is correct
   - Check email account hasn't been suspended

2. **Rate Limiting**:
   - Hostinger may limit email sending frequency
   - Wait and try again

3. **Firewall/Network Issues**:
   - Azure Functions may be blocked from accessing smtp.hostinger.com
   - Check Azure Function execution logs

### Debug Information

The enhanced error logging provides these details:

```javascript
// Environment check in Azure Function logs:
{
  nodeVersion: "v18.x.x",
  hasHostingerPassword: true,
  hasEmailPassword: true,
  hostingerPasswordLength: 16,
  availableEnvKeys: ["HOSTINGER_EMAIL_PASSWORD", "EMAIL_PASSWORD"]
}
```

## Production Checklist

Before going live:

- [ ] Environment variables configured in Azure Portal
- [ ] Test email function working: `sendQuickTestEmail()`
- [ ] Notification emails sending successfully
- [ ] Azure Function logs showing successful executions
- [ ] No 503 or CORS errors in browser console
- [ ] Email delivery confirmed in recipient inbox

## Quick Start Commands

After deployment, test immediately with:

```javascript
// In browser console on deployed app:
sendQuickTestEmail('your-email@example.com')

// Check environment detection:
console.log(window.location.hostname)
```

---

*This guide resolves the Azure email service 503 errors and provides a production-ready email notification system for CareXPS Healthcare CRM.*