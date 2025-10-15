# Password Reset Quick Start Guide - Phaeton AI CRM

## 🚀 5-Minute Implementation Checklist

### Phase 1: Supabase Dashboard (5 minutes)

1. **SMTP Configuration**
   - Go to: https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/settings/auth
   - Enable Custom SMTP
   - Host: `smtp.hostinger.com`
   - Port: `465`
   - Username: `aibot@phaetonai.com`
   - Password: `$Ineed1millie$` (from your .env.local)
   - Click **Save** and **Send Test Email**

2. **Redirect URLs**
   - Same page → URL Configuration section
   - Site URL: `https://carexps.nexasync.ca`
   - Add Redirect URLs:
     ```
     http://localhost:3000/reset-password
     http://localhost:3000/update-password
     https://carexps.nexasync.ca/reset-password
     https://carexps.nexasync.ca/update-password
     ```
   - Click **Save**

3. **Email Template**
   - Same page → Email Templates tab
   - Select "Reset Password"
   - Copy content from `email-templates/password-reset-template.html`
   - Paste into template editor
   - Click **Save**

### Phase 2: Database Migration (2 minutes)

Run the SQL migration to add audit logging:

```bash
# Connect to Supabase SQL Editor
# https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/editor

# Copy and paste contents of:
supabase/migrations/20251013000001_configure_password_reset.sql

# Click "Run" to execute
```

### Phase 3: React Components (10 minutes)

1. **Create New Files**
   ```
   src/pages/RequestPasswordResetPage.tsx
   src/pages/ResetPasswordPage.tsx
   ```
   Copy content from the setup guide.

2. **Update LoginPage.tsx**
   Add "Forgot password?" link (line 1094):
   ```typescript
   <a
     href="/request-password-reset"
     className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
   >
     Forgot password?
   </a>
   ```

3. **Update App.tsx**
   Add routes for password reset pages:
   ```typescript
   import { RequestPasswordResetPage } from '@/pages/RequestPasswordResetPage'
   import { ResetPasswordPage } from '@/pages/ResetPasswordPage'

   // Inside <Routes>:
   <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
   <Route path="/reset-password" element={<ResetPasswordPage />} />
   <Route path="/update-password" element={<ResetPasswordPage />} />
   ```

### Phase 4: Testing (5 minutes)

1. **Localhost Test**
   ```bash
   npm run dev
   ```
   - Go to http://localhost:3000/login
   - Click "Forgot password?"
   - Enter test email
   - Check inbox for reset email
   - Click link → Reset password → Login

2. **Production Test**
   ```bash
   git add .
   git commit -m "Add password reset functionality"
   git push origin main
   ```
   - Wait for Azure deployment
   - Test same flow on https://carexps.nexasync.ca

---

## 📋 Configuration Summary

### Supabase Settings Required

| Setting | Value |
|---------|-------|
| SMTP Host | smtp.hostinger.com |
| SMTP Port | 465 (SSL) |
| SMTP User | aibot@phaetonai.com |
| SMTP Pass | $Ineed1millie$ |
| Sender Name | Phaeton AI CRM |
| Site URL | https://carexps.nexasync.ca |
| Token Expiry | 3600 seconds (1 hour) |

### Redirect URLs

```
http://localhost:3000/reset-password
http://localhost:3000/update-password
https://carexps.nexasync.ca/reset-password
https://carexps.nexasync.ca/update-password
```

### New Routes Added

```typescript
/request-password-reset  → Request reset email
/reset-password          → Complete password reset
/update-password         → Alias for reset-password
```

---

## 🔍 Testing Scenarios

### Scenario 1: Successful Reset
1. User clicks "Forgot password?" on login page
2. Enters registered email address
3. Receives email within 30 seconds
4. Clicks reset link in email
5. Redirected to reset password page
6. Enters new password (min 8 chars, strong)
7. Confirms password matches
8. Submits form
9. Redirected to login page with success message
10. Logs in with new password

### Scenario 2: Invalid Email
1. User enters non-registered email
2. Still receives success message (security best practice)
3. No email actually sent
4. No error exposed to prevent email enumeration

### Scenario 3: Expired Link
1. User receives reset email
2. Waits more than 1 hour
3. Clicks reset link
4. Shows error: "Reset link has expired"
5. Prompts to request new reset link

### Scenario 4: Weak Password
1. User enters password < 8 characters
2. Password strength shows "Weak"
3. Submit button remains disabled
4. User must choose stronger password

---

## 🛠️ Troubleshooting

### Email Not Received?

**Check:**
- SMTP test email successful in Supabase dashboard?
- Email in spam/junk folder?
- Correct email address entered?
- SMTP password correct in Supabase settings?

**Solution:**
```bash
# Test SMTP connection
Supabase Dashboard → Auth → SMTP Settings → Send Test Email
```

### Reset Link Not Working?

**Check:**
- URL matches redirect URLs in Supabase?
- Link not expired (< 1 hour)?
- User clicked link from same browser?

**Solution:**
- Request new reset link
- Verify redirect URLs in Supabase settings

### Password Won't Reset?

**Check:**
- Password meets requirements (8+ chars, strong)?
- Passwords match in both fields?
- Console for error messages?

**Solution:**
```bash
# Check browser console (F12)
# Look for Supabase error messages
```

---

## 📊 Monitoring & Logs

### View Password Reset Audit Logs

```sql
-- Recent password reset attempts
SELECT
  email,
  reset_requested_at,
  status,
  failure_reason
FROM password_reset_audit
ORDER BY reset_requested_at DESC
LIMIT 20;

-- Daily statistics
SELECT * FROM password_reset_stats
ORDER BY reset_date DESC
LIMIT 7;
```

### Supabase Dashboard Logs

- Go to: Logs → Auth Logs
- Filter by: "password_recovery"
- Check for errors or bounces

---

## 🔐 Security Features

- ✅ 1-hour token expiration
- ✅ Single-use reset links
- ✅ Password strength validation
- ✅ Audit logging for all attempts
- ✅ Rate limiting (Supabase built-in)
- ✅ Secure SMTP (SSL/TLS)
- ✅ No email enumeration
- ✅ HIPAA-compliant audit trail

---

## 📞 Support

**Issues?**
- Check full guide: `SUPABASE_PASSWORD_RESET_SETUP_GUIDE.md`
- Email template: `email-templates/password-reset-template.html`
- SQL migration: `supabase/migrations/20251013000001_configure_password_reset.sql`

**Emergency Access:**
- Ctrl+Shift+U on login page for emergency unlock

---

**Total Implementation Time:** ~20 minutes

**Last Updated:** October 13, 2025
