# Azure Email Notifications Setup Guide

## Overview
This guide explains how to configure email notifications to work in your Azure Static Web Apps deployment at `https://carexps.nexasync.ca`.

## Architecture
- **Local Development**: Email server runs on `http://localhost:4001`
- **Azure Production**: Azure Functions handle email via `/api/send-notification-email`
- **Email Provider**: Hostinger SMTP (`carexps@phaetonai.com`)

## Azure Configuration Steps

### 1. Set Environment Variables in Azure Portal

Go to your Azure Static Web App ’ Configuration ’ Application settings and add:

```
Name: HOSTINGER_EMAIL_PASSWORD
Value: [Your Hostinger Email Password]
```

  **IMPORTANT**: This password is required for email notifications to work in production.

### 2. Verify Azure Functions Deployment

The Azure Functions are located in the `/api` folder and will be automatically deployed with your static web app. Ensure these files exist:

- `/api/send-notification-email/index.js` - Main email function
- `/api/send-notification-email/function.json` - Function configuration
- `/api/package.json` - Dependencies (nodemailer)
- `/api/host.json` - Azure Functions host configuration

### 3. Test in Azure Production

After deployment:

1. Navigate to `https://carexps.nexasync.ca/settings`
2. Go to **Notifications ’ Email Notification Settings**
3. Enable Email Notifications (toggle)
4. Add recipient email address(es)
5. Select notification types
6. Click **"Save Settings"**
7. Click **"Send Test Email"**

### 4. Monitor Azure Function Logs

To debug issues in production:

1. Go to Azure Portal ’ Your Static Web App ’ Functions
2. Click on `send-notification-email`
3. View "Invocations" and "Logs" tabs

## How It Works

### Local Development
```typescript
// Endpoint: http://localhost:4001/api/send-notification-email
// Source: src/api/emailServer.js (Express server)
```

### Azure Production
```typescript
// Endpoint: /api/send-notification-email (relative URL)
// Source: api/send-notification-email/index.js (Azure Function)
// Azure Static Web Apps automatically routes /api/* to Azure Functions
```

### Email Template Features
- **Logo Embedding**: Uses `cid:logo` for embedded logo image
- **Responsive Design**: Mobile-friendly email layout
- **HIPAA Compliant**: No PHI in emails, only general notifications
- **Professional Styling**: Blue gradient header with CareXPS branding

## Environment Detection

The `emailNotificationService.ts` automatically detects the environment:

```typescript
// Production (Azure)
if (window.location.hostname !== 'localhost') {
  return '/api/send-notification-email'
}

// Development (Local)
return 'http://localhost:4001/api/send-notification-email'
```

## Troubleshooting

### Issue: Email not sending in production
**Solution**:
1. Check Azure Function logs for errors
2. Verify `HOSTINGER_EMAIL_PASSWORD` is set in Azure configuration
3. Ensure email recipients are valid email addresses

### Issue: Logo not appearing in emails
**Solution**:
1. Check if `Logo.png` is included in build output
2. Azure Function searches multiple paths for logo:
   - `public/images/Logo.png`
   - Relative to function directory
3. If logo not found, email uses fallback (external URL)

### Issue: 503 Service Unavailable
**Solution**:
- This means `HOSTINGER_EMAIL_PASSWORD` environment variable is not set
- Add it in Azure Portal ’ Configuration ’ Application settings

### Issue: CORS errors
**Solution**:
- Azure Static Web Apps automatically handles CORS for `/api/*` routes
- No additional configuration needed

## Security

### CSP Configuration
Email API endpoints are allowed in Content Security Policy:

```javascript
connect-src 'self' http://localhost:4001 ... // Local development
// Production uses relative /api/* which is covered by 'self'
```

### SMTP Security
- **SSL/TLS**: Uses port 465 with secure connection
- **Authentication**: SMTP credentials stored as Azure environment variables
- **Privacy**: BCC used to protect recipient email addresses
- **HIPAA**: No PHI transmitted via email

## Testing Checklist

Before going live:
- [ ] Environment variable `HOSTINGER_EMAIL_PASSWORD` set in Azure
- [ ] Test email sent successfully from Azure production
- [ ] Logo appears correctly in received email
- [ ] All notification types work (SMS, Calls, Security, System)
- [ ] Recipients receive emails in timely manner
- [ ] Email passes spam filters

## Monitoring

### Success Indicators
```
 Email transporter created successfully
 Found logo at: [path]
 Logo attachment added to email
=ç Sending email to N recipients
 Email sent successfully: {messageId: ...}
```

### Error Indicators
```
L Email credentials not configured
  Logo file not found
L Email sending failed: [error]
```

## File Locations

### Frontend
- `src/services/emailNotificationService.ts` - Email client service
- `src/components/settings/EmailNotificationSettings.tsx` - UI component

### Backend
- `src/api/emailServer.js` - Local development server
- `api/send-notification-email/index.js` - Azure Function
- `api/package.json` - Azure Function dependencies

### Configuration
- `staticwebapp.config.json` - Azure Static Web Apps routing
- `.env.email` - Local development environment variables (not in git)
- Azure Portal - Production environment variables

## Support

If email notifications are not working after following this guide:

1. Check Azure Function logs in Azure Portal
2. Verify SMTP credentials are correct
3. Test SMTP connection manually using nodemailer
4. Contact Hostinger support if SMTP issues persist

---

*Last Updated: 2025-09-30 - Email Notifications with Logo Support*