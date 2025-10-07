# Email System Cloud Deployment Guide

## Overview
The email notification system is designed to work across all devices with cloud synchronization. This guide explains how to deploy the email server for production use.

## ✅ **Current Implementation Features**

### 1. **Environment-Aware Email API**
The email service automatically detects the environment and uses the appropriate endpoint:
- **Development**: `http://localhost:4001/api/send-notification-email`
- **Production**: `/api/send-notification-email` (relative) or `VITE_EMAIL_API_URL` if configured
- **Custom**: Can be configured via `VITE_EMAIL_API_URL` environment variable

### 2. **Cloud-Synced Settings**
Email notification settings are synchronized across devices using:
- **Primary Storage**: localStorage for immediate access
- **Cloud Sync**: Supabase `user_settings` table (when RLS policies allow)
- **Real-time Updates**: Supabase subscriptions for cross-device sync
- **Graceful Fallback**: Works offline with localStorage

### 3. **Security Features**
- **HIPAA Compliant**: No PHI in email notifications
- **CSP Headers**: Updated to allow localhost connections for development
- **SMTP Security**: SSL/TLS encryption with Hostinger SMTP
- **Audit Logging**: All email operations are logged

## 🚀 **Production Deployment Options**

### Option 1: Azure Functions (Recommended for Azure Static Web Apps)

1. **Create Azure Function App**:
   ```bash
   # Install Azure Functions Core Tools
   npm install -g azure-functions-core-tools@4

   # Create new function app
   func init emailServer --javascript
   cd emailServer
   func new --name SendNotificationEmail --template "HTTP trigger"
   ```

2. **Copy Email Server Code**:
   - Copy `src/api/emailServer.js` to Azure Functions project
   - Update to use Azure Functions format

3. **Configure Environment Variables in Azure**:
   ```
   HOSTINGER_EMAIL_PASSWORD=your-password
   EMAIL_SERVER_PORT=7071
   ```

4. **Deploy to Azure**:
   ```bash
   func azure functionapp publish your-function-app-name
   ```

5. **Update Frontend Environment**:
   ```env
   VITE_EMAIL_API_URL=https://your-function-app.azurewebsites.net
   ```

### Option 2: Node.js App Service

1. **Create App Service**:
   - Go to Azure Portal
   - Create new App Service
   - Choose Node.js 18 runtime

2. **Deploy Email Server**:
   ```bash
   # Package email server
   mkdir email-server-deploy
   cp src/api/emailServer.js email-server-deploy/
   cp package.json email-server-deploy/
   cd email-server-deploy
   npm install express cors nodemailer dotenv

   # Deploy via Git
   git init
   git add .
   git commit -m "Email server deployment"
   git remote add azure https://your-app.scm.azurewebsites.net/your-app.git
   git push azure master
   ```

3. **Configure App Service**:
   - Add environment variables in Configuration
   - Enable CORS for your frontend domain
   - Set up SSL certificate

### Option 3: Serverless (Vercel/Netlify Functions)

1. **Vercel Deployment**:
   ```javascript
   // api/send-notification-email.js
   export default async function handler(req, res) {
     // Email sending logic
   }
   ```

2. **Netlify Functions**:
   ```javascript
   // netlify/functions/send-notification-email.js
   exports.handler = async (event, context) => {
     // Email sending logic
   }
   ```

### Option 4: Docker Container

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY src/api/emailServer.js ./
   EXPOSE 4001
   CMD ["node", "emailServer.js"]
   ```

2. **Deploy to Azure Container Instances or similar**

## 📱 **Cross-Device Functionality**

### How It Works Across Devices:

1. **Mobile Device (iOS/Android)**:
   - User configures email settings
   - Settings save to localStorage immediately
   - Attempt to sync to Supabase cloud
   - Email sends via cloud-deployed API

2. **Desktop Browser**:
   - Settings load from Supabase if available
   - Falls back to localStorage if offline
   - Real-time sync when other devices update

3. **Tablet/iPad**:
   - Same functionality as desktop
   - Touch-optimized interface
   - Full email notification support

### Synchronization Flow:
```
Device A → Update Settings → localStorage → Supabase → Real-time Broadcast → Device B
                                    ↓
                              Email API (Cloud)
```

## 🔧 **Configuration for Production**

### 1. **Environment Variables (.env.production)**:
```env
# Email API Configuration
VITE_EMAIL_API_URL=https://your-email-api.azurewebsites.net

# Supabase (for settings sync)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Azure AD
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

### 2. **Email Server Environment (.env.email)**:
```env
# SMTP Configuration
HOSTINGER_EMAIL_PASSWORD=your-smtp-password
EMAIL_SERVER_PORT=4001

# Optional: Custom sender
SMTP_FROM_EMAIL=carexps@phaetonai.com
```

### 3. **Update CSP Headers** (Already Done):
- `staticwebapp.config.json` updated to allow localhost for development
- Production should use proper API domain

## 🧪 **Testing Cross-Device Functionality**

### Test Checklist:
- [ ] Configure email settings on Device A
- [ ] Verify settings appear on Device B (if logged in)
- [ ] Send test email from mobile device
- [ ] Send test email from desktop
- [ ] Test offline mode (disconnect internet, verify localStorage works)
- [ ] Test settings sync when coming back online
- [ ] Verify emails are received at configured addresses

### Console Commands for Testing:
```javascript
// Test email from any device browser console
emailNotificationService.testNotification()

// Send test to specific email
sendQuickTestEmail("test@example.com")

// Check current configuration
emailNotificationService.getConfiguration()
```

## 📊 **Monitoring & Troubleshooting**

### Common Issues:

1. **CSP Blocking Email API**:
   - Solution: Update CSP headers to include API domain
   - Already fixed for localhost

2. **Settings Not Syncing**:
   - Check Supabase RLS policies
   - Verify user is authenticated
   - Check browser console for sync errors

3. **Emails Not Sending**:
   - Verify email server is running
   - Check SMTP credentials
   - Review email server logs

4. **Cross-Device Sync Delay**:
   - Normal delay: 1-2 seconds
   - If longer, check Supabase real-time subscriptions
   - Verify network connectivity

### Debug Information:
```javascript
// Check if using production or development endpoint
console.log(window.location.hostname)

// Check Supabase connection
const { data, error } = await supabase.from('user_settings').select('*')
console.log('Supabase status:', { data, error })

// Check localStorage
console.log('Local settings:', localStorage.getItem(`settings_${userId}`))
```

## 🔒 **Security Considerations**

1. **API Authentication**:
   - Consider adding API key authentication for production
   - Rate limiting to prevent abuse

2. **CORS Configuration**:
   - Restrict to your domain only
   - Don't use wildcard (*) in production

3. **Environment Variables**:
   - Never commit `.env` files
   - Use Azure Key Vault or similar for secrets

4. **Audit Logging**:
   - All email operations logged
   - Monitor for suspicious activity

## 🚢 **Deployment Checklist**

### Pre-Deployment:
- [ ] Email server tested locally
- [ ] Environment variables configured
- [ ] CSP headers updated
- [ ] SMTP credentials verified

### Deployment:
- [ ] Deploy email server to cloud
- [ ] Update VITE_EMAIL_API_URL
- [ ] Build and deploy frontend
- [ ] Test from multiple devices

### Post-Deployment:
- [ ] Verify email delivery
- [ ] Check cross-device sync
- [ ] Monitor error logs
- [ ] Test failover scenarios

## 📝 **Summary**

The email notification system is fully prepared for cloud deployment with:
- ✅ Environment-aware API endpoints
- ✅ Cross-device synchronization
- ✅ Offline functionality with localStorage
- ✅ HIPAA-compliant email templates
- ✅ Multiple deployment options
- ✅ Graceful error handling

To enable email notifications from any device:
1. Deploy the email server to your chosen cloud platform
2. Set VITE_EMAIL_API_URL to your deployed endpoint
3. Rebuild and deploy the frontend application
4. Configure email settings from any device - they'll sync automatically!

---

*Last Updated: Email Cloud Deployment Guide - Generated by Claude Code*