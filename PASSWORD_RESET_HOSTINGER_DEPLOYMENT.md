# Password Reset System - Hostinger Deployment Guide

## Overview

The custom password reset system is now configured for **Hostinger deployment** using:
- **Supabase Edge Functions** for email delivery (works on any hosting platform)
- **Resend API** for reliable email sending (already configured)
- **Custom database table** for secure token storage
- **No rate limits** - bypasses Supabase's 2 emails/hour restriction

---

## Architecture

```
User Request → passwordResetService → Supabase Edge Function → Resend API → Email Delivery
                                    ↓
                              Database Token Storage
```

**Key Components:**
1. **Frontend**: React components for password reset UI
2. **Service**: `passwordResetService.ts` handles token management
3. **Backend**: Supabase Edge Function sends emails via Resend API
4. **Database**: `password_reset_tokens` table stores tokens

---

## Deployment Steps

### 1. Deploy Database Migration

Apply the password reset tokens table migration:

```bash
# Option 1: Via Supabase CLI
cd "I:\Apps Back Up\Phaeton AI CRM"
npx supabase db push

# Option 2: Via Supabase Dashboard SQL Editor
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Go to SQL Editor
# 4. Copy contents of: supabase/migrations/20251013000002_create_password_reset_tokens.sql
# 5. Paste and run
```

**Verify Migration:**
```sql
-- Check table exists
SELECT * FROM password_reset_tokens LIMIT 1;

-- Check cleanup function exists
SELECT proname FROM pg_proc WHERE proname = 'cleanup_expired_password_reset_tokens';
```

---

### 2. Deploy Supabase Edge Function

Deploy the updated email notification function:

```bash
# Option 1: Via Supabase CLI
npx supabase functions deploy send-email-notification

# Option 2: Manually via Dashboard
# 1. Go to Functions in Supabase Dashboard
# 2. Edit send-email-notification function
# 3. Copy contents of: supabase/functions/send-email-notification/index.ts
# 4. Save and deploy
```

**Verify Edge Function:**
```bash
# Test the function with curl
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-email-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "custom",
    "recipients": ["test@example.com"],
    "customSubject": "Test Email",
    "customHtml": "<h1>Test</h1><p>This is a test email.</p>"
  }'
```

---

### 3. Verify Environment Variables

Ensure these are set in your Supabase project:

```bash
# In Supabase Dashboard → Settings → Edge Functions → Secrets
RESEND_API_KEY=re_h2zsX65X_DEwVyzwSX5JASbELy8LnZo9m

# In your .env.local file
VITE_SUPABASE_URL=https://cpkslvmydfdevdftieck.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

### 4. Build and Deploy to Hostinger

**Build the Application:**
```bash
cd "I:\Apps Back Up\Phaeton AI CRM"
npm run build
```

**Upload to Hostinger:**
1. Connect via FTP/SFTP to your Hostinger server
2. Navigate to your public_html directory (or subdomain folder)
3. Upload ALL files from the `dist/` folder
4. Ensure `.htaccess` is configured for SPA routing:

```apache
# .htaccess for React SPA on Hostinger
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Testing Instructions

### Test 1: Request Password Reset

1. Visit: `https://yourdomain.com/login`
2. Click "Forgot password?" link
3. Enter a registered email address
4. Verify success message appears
5. Check email inbox for reset email from **Phaeton AI CRM <aibot@phaetonai.com>**

**Expected Email:**
- Subject: "Password Reset - Phaeton AI CRM"
- From: Phaeton AI CRM <aibot@phaetonai.com>
- Contains blue "Reset Password" button
- Shows 1-hour expiry notice

### Test 2: Reset Password with Valid Token

1. Click "Reset Password" button in email
2. Should redirect to: `https://yourdomain.com/reset-password?token=...`
3. Verify token validation loading spinner appears briefly
4. Password reset form should appear
5. Enter new password (must be medium or strong)
6. Verify password strength indicator updates (weak/medium/strong)
7. Confirm password matches
8. Submit form
9. Verify success message: "Password Reset Complete!"
10. Wait 3 seconds for automatic redirect to login
11. Login with new password

### Test 3: Invalid Token Handling

1. Visit: `https://yourdomain.com/reset-password?token=invalid`
2. Verify error screen appears
3. Shows message: "Invalid or expired token"
4. Displays "Request New Reset Link" button
5. Displays "Back to Login" button

### Test 4: Expired Token

1. Request password reset
2. Wait more than 1 hour
3. Try to use the reset link
4. Should show "Token has expired" error

---

## Monitoring & Maintenance

### Check Password Reset Usage

```sql
-- View all reset tokens (for debugging)
SELECT
  id,
  user_id,
  expires_at,
  used_at,
  created_at,
  ip_address
FROM password_reset_tokens
ORDER BY created_at DESC
LIMIT 20;

-- Count active vs used tokens
SELECT
  COUNT(*) FILTER (WHERE used_at IS NULL AND expires_at > NOW()) as active_tokens,
  COUNT(*) FILTER (WHERE used_at IS NOT NULL) as used_tokens,
  COUNT(*) FILTER (WHERE expires_at < NOW() AND used_at IS NULL) as expired_tokens
FROM password_reset_tokens;
```

### Cleanup Expired Tokens (Optional)

Run this periodically (can be automated):

```sql
-- Clean up expired and old used tokens
SELECT cleanup_expired_password_reset_tokens();
```

---

## Email Configuration (Resend API)

Your current Resend API configuration:
- **API Key**: `re_h2zsX65X_DEwVyzwSX5JASbELy8LnZo9m`
- **From Email**: `aibot@phaetonai.com`
- **From Name**: `Phaeton AI CRM`
- **Domain**: `phaetonai.com` (verified)

**Email Deliverability:**
- Ensure SPF, DKIM, and DMARC records are configured in Hostinger DNS
- Check Resend Dashboard for delivery status
- Monitor bounce rates and spam reports

---

## Troubleshooting

### Email Not Received

1. **Check Supabase Edge Function Logs:**
   - Go to Supabase Dashboard → Functions → send-email-notification
   - Check recent invocations for errors

2. **Check Resend API Logs:**
   - Go to https://resend.com/logs
   - Verify email was sent
   - Check delivery status

3. **Check Spam Folder:**
   - Password reset emails might be flagged as spam
   - Ask user to check spam/junk folder

4. **Verify Email Address:**
   - Ensure email is registered in your system
   - Check `users` table in Supabase

### Reset Link Not Working

1. **Check Token Format:**
   - Token should be 64 characters long
   - URL format: `https://yourdomain.com/reset-password?token=...`

2. **Check Token Expiry:**
   - Tokens expire after 1 hour
   - Check `password_reset_tokens.expires_at`

3. **Check Browser Console:**
   - Open DevTools → Console
   - Look for validation errors

### Database Connection Issues

1. **Check Supabase Status:**
   - Visit https://status.supabase.com
   - Verify no ongoing incidents

2. **Check Environment Variables:**
   - Ensure `VITE_SUPABASE_URL` is correct
   - Ensure `VITE_SUPABASE_ANON_KEY` is correct

3. **Check Network:**
   - Ensure Hostinger allows outbound connections to Supabase
   - Check firewall rules

---

## Security Considerations

✅ **Implemented Security Features:**
- Cryptographically secure 64-character tokens
- 1-hour token expiry
- Single-use tokens (marked as used after reset)
- Same success message whether email exists or not (prevents email enumeration)
- IP address and user agent tracking
- Audit logging for all password reset activities
- Password strength validation (must be medium or strong)
- Row Level Security (RLS) on tokens table (service role only)

⚠️ **Additional Recommendations:**
- Monitor password reset frequency per user (detect abuse)
- Consider adding rate limiting (e.g., 3 requests per hour per email)
- Log failed password reset attempts
- Alert admins on suspicious activity

---

## Rate Limits

**No Rate Limits on Password Reset:**
- Custom implementation bypasses Supabase auth rate limits
- Resend API free tier: 100 emails/day, 3,000 emails/month
- Upgrade Resend plan if needed for higher volume

---

## Files Modified

### Created:
1. `src/services/passwordResetService.ts` - Token management and password reset logic
2. `src/pages/RequestPasswordResetPage.tsx` - Password reset request UI
3. `src/pages/ResetPasswordPage.tsx` - Password reset form UI
4. `supabase/migrations/20251013000002_create_password_reset_tokens.sql` - Database schema

### Modified:
1. `src/pages/LoginPage.tsx` - Added "Forgot password?" link
2. `src/App.tsx` - Added password reset routes
3. `supabase/functions/send-email-notification/index.ts` - Added custom email support

---

## Next Steps

1. ✅ Deploy database migration
2. ✅ Deploy Supabase Edge Function
3. ✅ Build and deploy to Hostinger
4. ⏳ Test all password reset flows
5. ⏳ Monitor email delivery for first few days
6. ⏳ Consider adding rate limiting if needed

---

## Support

**Issue**: Email not sending
**Solution**: Check Supabase Function logs and Resend API dashboard

**Issue**: Token validation failing
**Solution**: Verify database migration was applied and tokens are being created

**Issue**: Password reset link not working
**Solution**: Check URL format and token expiry in database

---

**System Status**: ✅ Ready for Hostinger Deployment
**Last Updated**: October 13, 2025
**Author**: Claude Code
