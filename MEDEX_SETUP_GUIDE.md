# MedEx Healthcare CRM - Setup Guide

## Overview
This guide will help you set up MedEx CRM from scratch with a fresh Supabase database and new Retell AI credentials.

---

## 1. Supabase Database Setup

### Create New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter project details:
   - **Name**: MedEx CRM
   - **Database Password**: (Generate a strong password and save it securely)
   - **Region**: Choose closest to your users
4. Wait for project provisioning to complete

### Get Supabase Credentials
Once your project is ready, get these values from Project Settings > API:
- **URL**: `https://[YOUR_PROJECT_REF].supabase.co`
- **Anon/Public Key**: `eyJhbGci...` (long JWT token)
- **Service Role Key**: `eyJhbGci...` (different JWT token - keep this secret!)

### Run Database Migrations

You need to run these SQL migration files in order on your Supabase database:

1. **Go to SQL Editor** in Supabase Dashboard
2. **Run migrations in this exact order**:

#### Core Tables (Required)
```sql
-- File: src/migrations/000_create_tables.sql
-- Creates: user_settings, user_mfa_configs, mfa_challenges tables
```

#### User Profiles (Required)
```sql
-- File: supabase/migrations/create_user_profiles_table.sql
-- Creates: users table with profile information
```

#### Audit Logging (Required for HIPAA Compliance)
```sql
-- File: supabase/migrations/20241226000001_create_audit_logs_table.sql
-- Creates: audit_logs table for compliance tracking
```
```sql
-- File: supabase/migrations/20241226000002_add_missing_audit_columns.sql
-- Adds: Additional audit columns
```

#### MFA Enhancement
```sql
-- File: supabase/migrations/20241226000001_fix_mfa_uuid_mappings.sql
-- Adds: UUID mapping support for MFA
```

#### User Management
```sql
-- File: supabase/migrations/20250929000001_add_last_login_column.sql
-- Adds: last_login tracking
```
```sql
-- File: supabase/migrations/user_management_rls_policies.sql
-- Adds: Row Level Security policies for user management
```

#### RLS Fixes
```sql
-- File: supabase/migrations/fix_user_profiles_rls_policies.sql
-- Fixes: User profile security policies
```

#### Avatar Upload Support
```sql
-- File: supabase/migrations/fix_avatar_upload.sql
-- Adds: Avatar storage bucket and policies
```

#### Optional: Stripe Billing (if needed)
```sql
-- File: supabase/migrations/20250101000001_add_stripe_auto_invoice.sql
-- Adds: Stripe invoice automation tables
```

### Enable Supabase Realtime (Required)
1. Go to Database > Replication in Supabase Dashboard
2. Enable realtime for these tables:
   - `user_settings`
   - `audit_logs`
   - `users`

---

## 2. Retell AI Configuration

### Get Your Retell AI Credentials
1. Log into your Retell AI dashboard
2. Get your **API Key** (format: `key_xxxxxxxxxxxxxxxxxxxxx`)
3. Create **2 Agent IDs**:
   - **Call Agent**: For voice interactions (format: `agent_xxxxxxxxxxxxxxxxxxxxx`)
   - **SMS Agent**: For text/chat interactions (format: `agent_xxxxxxxxxxxxxxxxxxxxx`)

### Update Credentials in Code
Edit the file: `src/config/retellCredentials.ts`

Replace these placeholder values:
```typescript
export const HARDCODED_RETELL_CREDENTIALS: RetellCredentials = {
  // Replace with your actual MedEx API Key
  apiKey: 'key_YOUR_ACTUAL_API_KEY_HERE',

  // Replace with your actual MedEx Call Agent ID
  callAgentId: 'agent_YOUR_CALL_AGENT_ID_HERE',

  // Replace with your actual MedEx SMS Agent ID
  smsAgentId: 'agent_YOUR_SMS_AGENT_ID_HERE'
}
```

---

## 3. Environment Variables

### Create `.env.local` for Development
Create a file named `.env.local` in the project root:

```bash
# Supabase Configuration (from Step 1)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Azure AD Configuration
# You'll create this in Azure Portal (see Step 4)
VITE_AZURE_CLIENT_ID=your_azure_client_id
VITE_AZURE_TENANT_ID=your_azure_tenant_id
VITE_AZURE_REDIRECT_URI=http://localhost:3000

# App Configuration
VITE_APP_NAME=MedEx Healthcare CRM
VITE_APP_ENVIRONMENT=development
VITE_APP_URL=http://localhost:3000

# Security Configuration - CRITICAL
# Generate these keys using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
VITE_HIPAA_MODE=true
VITE_PHI_ENCRYPTION_KEY=generate_64_char_hex_key_here
VITE_AUDIT_ENCRYPTION_KEY=generate_different_64_char_hex_key_here

# Optional: OpenAI for Help Chatbot
VITE_OPENAI_API_KEY=your_openai_key_if_needed

# Optional: Twilio for SMS/Voice Cost Tracking
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_token
```

### Generate Encryption Keys
Run this command to generate secure encryption keys:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run it twice to get two different keys for PHI and Audit encryption.

### Create `.env.production` for Azure Deployment
Copy `.env.production.template` to `.env.production` and fill in production values:
```bash
# All same as .env.local but with:
VITE_APP_URL=https://medex.nexasync.ca
VITE_AZURE_REDIRECT_URI=https://medex.nexasync.ca
VITE_APP_ENVIRONMENT=production
```

---

## 4. Azure AD App Registration

### Create New Azure AD Application
1. Go to Azure Portal: https://portal.azure.com
2. Navigate to **Azure Active Directory** > **App Registrations**
3. Click **New Registration**
   - **Name**: MedEx Healthcare CRM
   - **Supported Account Types**: Single tenant (your organization only)
   - **Redirect URI**:
     - Type: Single-page application (SPA)
     - URI: `https://medex.nexasync.ca` (production)
4. Click **Register**

### Configure Authentication
1. Go to **Authentication** in your app registration
2. Add additional redirect URIs:
   - `http://localhost:3000` (for development)
   - `http://localhost:3000/` (with trailing slash)
   - `https://medex.nexasync.ca/` (with trailing slash)
3. Under **Implicit grant and hybrid flows**, enable:
   - ✅ Access tokens
   - ✅ ID tokens
4. Save changes

### Get Azure AD Credentials
From the **Overview** page of your app registration:
- **Application (client) ID**: This is your `VITE_AZURE_CLIENT_ID`
- **Directory (tenant) ID**: This is your `VITE_AZURE_TENANT_ID`

Add these to your `.env.local` and `.env.production` files.

---

## 5. Azure Static Web App Deployment

### Create Azure Static Web App
1. Go to Azure Portal
2. Create **Static Web App**
   - **Name**: medex-healthcare-crm
   - **Region**: Choose closest to users
   - **Deployment Source**: GitHub
   - **Repository**: Your MedEx GitHub repository
   - **Branch**: main
   - **Build Presets**: Custom
   - **App location**: /
   - **Api location**: api
   - **Output location**: dist

### Get Deployment Token
After creation:
1. Go to your Static Web App in Azure Portal
2. Click **Manage deployment token**
3. Copy the token

### Configure GitHub Secrets
In your GitHub repository, go to **Settings** > **Secrets and variables** > **Actions**

Add these secrets:
- `AZURE_STATIC_WEB_APPS_API_TOKEN_MEDEX`: (the token from above)
- `VITE_PHI_ENCRYPTION_KEY`: (your PHI encryption key)
- `VITE_AUDIT_ENCRYPTION_KEY`: (your audit encryption key)
- `VITE_SUPABASE_URL`: (your Supabase URL)
- `VITE_SUPABASE_ANON_KEY`: (your Supabase anon key)
- `VITE_OPENAI_API_KEY`: (if using OpenAI)
- `HOSTINGER_EMAIL_PASSWORD`: (if using email notifications)

### Configure Custom Domain
1. In Azure Static Web App, go to **Custom domains**
2. Add `medex.nexasync.ca`
3. Follow DNS configuration instructions from Azure
4. Wait for SSL certificate provisioning

---

## 6. Logo Setup

### Add MedEx Logo
1. Save your logo file as: `public/images/medex-logo.png`
2. Update the logo service defaults in `src/services/logoService.ts`:
   - Line 211: Change to `'/images/medex-logo.png'`

### Update Favicon
1. Create/upload favicon: `public/images/medex-favicon.png`
2. Update in `index.html`:
   - Line 5: Update favicon href
   - Line 6: Update shortcut icon href

---

## 7. First Deployment

### Test Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Deploy to Azure
```bash
# Commit all changes
git add .
git commit -m "Initial MedEx setup"
git push origin main

# GitHub Actions will automatically deploy to Azure
```

### Verify Deployment
1. Check GitHub Actions tab for workflow status
2. Once complete, visit: https://medex.nexasync.ca
3. Test login with Azure AD credentials

---

## 8. Initial Configuration

### Create First Super User
1. Log in with your Azure AD account
2. Open browser console
3. Run this command to promote yourself to super user:
```javascript
// Get your user ID from localStorage
const currentUser = JSON.parse(localStorage.getItem('currentUser'))
console.log('Your User ID:', currentUser.id)

// Manually update in Supabase Dashboard:
// Go to Table Editor > users > find your user > set role = 'super_user'
```

### Set Up MFA (Mandatory)
1. Go to Settings > Security
2. Click "Enable MFA"
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes securely

### Configure Retell AI Settings
1. Go to Settings
2. Verify Retell AI credentials are loaded
3. Test a call or SMS to confirm integration

---

## 9. Troubleshooting

### Database Connection Issues
- Verify Supabase URL and keys in `.env.local`
- Check if Supabase project is active (not paused)
- Ensure RLS policies are enabled

### Authentication Errors
- Verify Azure AD redirect URIs match exactly
- Check tenant ID and client ID are correct
- Clear browser cache and try again

### Retell AI Not Working
- Confirm API key and agent IDs are correct in `retellCredentials.ts`
- Check browser console for credential errors
- Verify Retell AI account is active

### Deployment Failures
- Check GitHub Actions logs for errors
- Verify all GitHub secrets are set correctly
- Ensure build completes successfully locally first

---

## 10. Database Migration SQL Files

All migration files are located in:
- `src/migrations/` - Core application tables
- `supabase/migrations/` - Supabase-specific migrations

Run them in order as specified in Section 1.

---

## 11. Next Steps

After successful deployment:
1. ✅ Create admin users
2. ✅ Configure notification settings
3. ✅ Test call and SMS functionality
4. ✅ Set up backup procedures
5. ✅ Review HIPAA compliance settings
6. ✅ Train staff on MFA usage

---

## Support

For issues or questions:
- Check `CLAUDE.md` for detailed technical documentation
- Review `troubleshooting.md` for common problems
- Contact your development team

---

**Last Updated**: January 2025
**Version**: MedEx CRM v1.0
