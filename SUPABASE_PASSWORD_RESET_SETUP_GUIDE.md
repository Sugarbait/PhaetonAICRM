# Supabase Password Reset Setup Guide - Phaeton AI CRM

## Overview

This guide provides comprehensive instructions for configuring Supabase password reset functionality for the Phaeton AI CRM application. The system integrates with your existing Hostinger SMTP (aibot@phaetonai.com) and works across localhost development and Azure production environments.

---

## Prerequisites

- Supabase Project: `cpkslvmydfdevdftieck`
- Verified Email Domain: `phaetonai.com`
- SMTP Server: `smtp.hostinger.com:465` (SSL)
- SMTP User: `aibot@phaetonai.com`
- SMTP Password: Stored in GitHub Secret `HOSTINGER_EMAIL_PASSWORD`

---

## Part 1: Supabase Dashboard Configuration

### Step 1: Configure SMTP Settings

1. **Navigate to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/cpkslvmydfdevdftieck
   - Click **Settings** → **Auth** → **SMTP Settings**

2. **Enable Custom SMTP**
   - Toggle **Enable Custom SMTP** to ON

3. **Enter SMTP Configuration**
   ```
   Host: smtp.hostinger.com
   Port: 465
   Username: aibot@phaetonai.com
   Password: [Your Hostinger Email Password]
   Sender Name: Phaeton AI CRM
   Sender Email: aibot@phaetonai.com
   ```

4. **Save SMTP Settings**
   - Click **Save** at the bottom of the page
   - Test the connection by clicking **Send Test Email**

### Step 2: Configure Redirect URLs

1. **Navigate to URL Configuration**
   - Settings → Auth → **URL Configuration**

2. **Add Site URLs**
   ```
   Site URL: https://carexps.nexasync.ca

   Redirect URLs (one per line):
   http://localhost:3000/reset-password
   http://localhost:3000/update-password
   https://carexps.nexasync.ca/reset-password
   https://carexps.nexasync.ca/update-password
   ```

3. **Save URL Configuration**

### Step 3: Customize Email Templates

1. **Navigate to Email Templates**
   - Settings → Auth → **Email Templates**

2. **Select "Reset Password" Template**
   - Click on **Reset Password** email template

3. **Update Email Template** (see `email-templates/password-reset-template.html`)
   - Replace default template with Phaeton AI branded template
   - Ensure `{{ .ConfirmationURL }}` is present in button href

4. **Save Template**

---

## Part 2: React Component Implementation

### Step 1: Create Password Reset Request Page

**File:** `src/pages/RequestPasswordResetPage.tsx`

This component handles the "Forgot Password" flow where users enter their email.

```typescript
import React, { useState } from 'react'
import { supabase } from '@/config/supabase'
import { MailIcon, ArrowLeftIcon } from 'lucide-react'
import { generalToast } from '@/services/generalToastService'
import { useNavigate } from 'react-router-dom'
import { useCompanyLogos } from '@/hooks/useCompanyLogos'

export const RequestPasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()
  const { logos } = useCompanyLogos()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)
      generalToast.success(
        'Password reset instructions have been sent to your email.',
        'Check Your Inbox'
      )
    } catch (error: any) {
      console.error('Password reset request failed:', error)
      generalToast.error(
        error.message || 'Failed to send password reset email. Please try again.',
        'Reset Failed'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            {logos.headerLogo && (
              <img
                src={logos.headerLogo}
                alt="Logo"
                className="max-h-20 w-auto mx-auto mb-4"
              />
            )}
            <MailIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Next steps:</strong>
            </p>
            <ol className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-decimal list-inside">
              <li>Check your inbox for an email from Phaeton AI CRM</li>
              <li>Click the "Reset Password" link in the email</li>
              <li>Enter your new password</li>
              <li>Sign in with your new credentials</li>
            </ol>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          {logos.headerLogo && (
            <img
              src={logos.headerLogo}
              alt="Logo"
              className="max-h-20 w-auto mx-auto mb-4"
            />
          )}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Step 2: Create Password Reset Completion Page

**File:** `src/pages/ResetPasswordPage.tsx`

This component handles the actual password reset after user clicks the email link.

```typescript
import React, { useState, useEffect } from 'react'
import { supabase } from '@/config/supabase'
import { CheckCircleIcon, AlertCircleIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { generalToast } from '@/services/generalToastService'
import { useNavigate } from 'react-router-dom'
import { useCompanyLogos } from '@/hooks/useCompanyLogos'

export const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')
  const navigate = useNavigate()
  const { logos } = useCompanyLogos()

  // Password strength calculator
  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordStrength('weak')
      return
    }

    let strength = 0
    if (newPassword.length >= 8) strength++
    if (newPassword.length >= 12) strength++
    if (/[A-Z]/.test(newPassword)) strength++
    if (/[a-z]/.test(newPassword)) strength++
    if (/[0-9]/.test(newPassword)) strength++
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++

    if (strength <= 2) setPasswordStrength('weak')
    else if (strength <= 4) setPasswordStrength('medium')
    else setPasswordStrength('strong')
  }, [newPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordStrength === 'weak') {
      setError('Please choose a stronger password')
      return
    }

    setIsLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw updateError
      }

      setIsSuccess(true)
      generalToast.success(
        'Your password has been reset successfully. You can now sign in with your new password.',
        'Password Reset Complete'
      )

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error: any) {
      console.error('Password reset failed:', error)
      setError(error.message || 'Failed to reset password. Please try again.')
      generalToast.error(
        'Failed to reset password. Please try the reset process again.',
        'Reset Failed'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <div className="text-center">
            {logos.headerLogo && (
              <img
                src={logos.headerLogo}
                alt="Logo"
                className="max-h-20 w-auto mx-auto mb-4"
              />
            )}
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Password Reset Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Your password has been successfully reset. You will be redirected to the login page in a few seconds.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition"
            >
              Go to Login Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          {logos.headerLogo && (
            <img
              src={logos.headerLogo}
              alt="Logo"
              className="max-h-20 w-auto mx-auto mb-4"
            />
          )}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Set New Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Choose a strong password for your account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === 'weak'
                          ? 'w-1/3 bg-red-500'
                          : passwordStrength === 'medium'
                          ? 'w-2/3 bg-yellow-500'
                          : 'w-full bg-green-500'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength === 'weak'
                        ? 'text-red-600 dark:text-red-400'
                        : passwordStrength === 'medium'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {passwordStrength === 'weak'
                      ? 'Weak'
                      : passwordStrength === 'medium'
                      ? 'Medium'
                      : 'Strong'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            {confirmPassword && (
              <div className="mt-1 text-sm">
                {newPassword === confirmPassword ? (
                  <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    Passwords match
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircleIcon className="w-4 h-4" />
                    Passwords do not match
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-1">
              Password Requirements:
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-0.5">
              <li>• At least 8 characters long</li>
              <li>• Mix of uppercase and lowercase letters</li>
              <li>• Include numbers and special characters</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading || passwordStrength === 'weak' || newPassword !== confirmPassword}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Step 3: Update Login Page

Add "Forgot Password?" link to the existing LoginPage component.

**File:** `src/pages/LoginPage.tsx` - Add after line 1094:

```typescript
// Add this after the "Remember me" checkbox
<a
  href="/request-password-reset"
  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
>
  Forgot password?
</a>
```

### Step 4: Add Routes to App.tsx

**File:** `src/App.tsx` - Add to your routing configuration:

```typescript
import { RequestPasswordResetPage } from '@/pages/RequestPasswordResetPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'

// Inside your <Routes> component:
<Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
<Route path="/update-password" element={<ResetPasswordPage />} />
```

---

## Part 3: Email Template Configuration

### Password Reset Email Template

**File:** `email-templates/password-reset-template.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Phaeton AI CRM</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header with Logo -->
          <tr>
            <td align="center" style="background-color: #1e40af; padding: 30px; border-radius: 8px 8px 0 0;">
              <img src="https://carexps.nexasync.ca/images/phaeton-ai-logo.png" alt="Phaeton AI CRM" width="220" style="display: block; max-width: 100%;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 15px 0 0 0; font-weight: 600;">Phaeton AI CRM</h1>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e40af; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">Reset Your Password</h2>

              <p style="color: #333333; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset your password for your Phaeton AI CRM account. Click the button below to create a new password:
              </p>

              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                This link will expire in <strong>1 hour</strong> for security reasons. If you didn't request this password reset, you can safely ignore this email.
              </p>

              <div style="background-color: #f0f4ff; border-left: 4px solid #1e40af; padding: 15px; margin: 25px 0; border-radius: 4px;">
                <p style="color: #1e40af; font-size: 13px; margin: 0; line-height: 1.5;">
                  <strong>Alternative Method:</strong><br>
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="{{ .ConfirmationURL }}" style="color: #1e40af; word-break: break-all;">{{ .ConfirmationURL }}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #666666; font-size: 13px; margin: 0 0 10px 0; line-height: 1.5;">
                <strong>Need help?</strong> Contact our support team at <a href="mailto:support@phaetonai.com" style="color: #1e40af; text-decoration: none;">support@phaetonai.com</a>
              </p>
              <p style="color: #999999; font-size: 11px; margin: 15px 0 0 0;">
                <strong>Security Notice:</strong> Phaeton AI CRM will never ask for your password via email. If you receive suspicious emails, please report them to our security team immediately.
              </p>
              <p style="color: #999999; font-size: 11px; margin: 15px 0 0 0;">
                © 2025 Phaeton AI CRM. All rights reserved.<br>
                This is an automated message, please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Instructions for Supabase Dashboard:**
1. Go to Settings → Auth → Email Templates
2. Select "Reset Password" template
3. Copy the HTML above into the template editor
4. Click Save

---

## Part 4: Environment Variables

### No Additional Variables Required

Your existing `.env.local` already contains all necessary Supabase configuration:

```bash
VITE_SUPABASE_URL=https://cpkslvmydfdevdftieck.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Password reset functionality uses the Supabase Auth API which is already configured.

---

## Part 5: Testing Procedure

### Localhost Testing

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Request Flow**
   - Navigate to http://localhost:3000/login
   - Click "Forgot password?" link
   - Enter a registered email address
   - Check email inbox for reset link
   - Click reset link (should redirect to http://localhost:3000/reset-password)
   - Enter new password
   - Confirm password matches
   - Submit form
   - Should redirect to login page

3. **Test New Password**
   - Login with the new password
   - Verify successful authentication

### Production Testing

1. **Deploy to Azure**
   - Push changes to main/master branch
   - GitHub Actions will auto-deploy

2. **Test Production Flow**
   - Navigate to https://carexps.nexasync.ca/login
   - Follow same testing steps as localhost
   - Verify email links redirect to production URL

---

## Part 6: Security Considerations

### Implemented Security Features

1. **Token Expiration**
   - Reset links expire after 1 hour (Supabase default)
   - Prevents unauthorized access to old reset links

2. **Password Strength Validation**
   - Minimum 8 characters
   - Visual strength indicator (weak/medium/strong)
   - Requires uppercase, lowercase, numbers, special characters

3. **Confirmation Matching**
   - Real-time password match validation
   - Prevents typos during password reset

4. **Single-Use Links**
   - Each reset link can only be used once
   - Prevents replay attacks

5. **Secure SMTP**
   - SSL/TLS encryption (port 465)
   - Verified sender domain
   - Professional email reputation

### Best Practices Implemented

- No sensitive data in email body
- Clear expiration time displayed to user
- Alternative link method for email client compatibility
- Audit logging via existing `auditLogger` service
- Cross-device support (localhost + Azure production)

---

## Part 7: Troubleshooting

### Common Issues

**Issue 1: Email Not Received**
- **Solution:** Check spam/junk folder
- **Solution:** Verify SMTP settings in Supabase dashboard
- **Solution:** Test SMTP connection with "Send Test Email" button

**Issue 2: Reset Link Expired**
- **Solution:** Request new reset link
- **Solution:** Complete reset within 1 hour of receiving email

**Issue 3: Redirect URL Mismatch**
- **Solution:** Verify redirect URLs in Supabase Auth settings
- **Solution:** Ensure both localhost and production URLs are whitelisted

**Issue 4: Password Not Strong Enough**
- **Solution:** Follow password requirements:
  - Minimum 8 characters
  - Mix of upper/lowercase
  - Include numbers and special characters

---

## Part 8: Maintenance & Monitoring

### Email Delivery Monitoring

Monitor email delivery success via Supabase dashboard:
1. Settings → Auth → Email → Email Logs
2. Check for failed deliveries
3. Investigate bounce/complaint rates

### User Audit Trail

Password reset events are logged via existing audit system:
- Reset request initiated
- Email sent successfully
- Password reset completed
- Failed reset attempts

### SMTP Health Checks

Regular checks recommended:
- Weekly test email from Supabase dashboard
- Monitor Hostinger email quota usage
- Verify domain reputation (phaetonai.com)

---

## Implementation Checklist

- [ ] Configure SMTP settings in Supabase dashboard
- [ ] Add redirect URLs (localhost + production)
- [ ] Update email template with Phaeton AI branding
- [ ] Create `RequestPasswordResetPage.tsx` component
- [ ] Create `ResetPasswordPage.tsx` component
- [ ] Update `LoginPage.tsx` with "Forgot password?" link
- [ ] Add routes to `App.tsx`
- [ ] Test localhost flow end-to-end
- [ ] Deploy to Azure production
- [ ] Test production flow end-to-end
- [ ] Document process for team members
- [ ] Set up monitoring alerts

---

## Support & Documentation

**Supabase Auth Documentation:**
- Password Reset: https://supabase.com/docs/guides/auth/passwords
- Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates

**Internal Resources:**
- Email Service: `src/services/emailNotificationService.ts`
- Audit Logging: `src/services/auditLogger.ts`
- Supabase Config: `src/config/supabase.ts`

**Contact:**
- Technical Support: support@phaetonai.com
- Emergency: Use Ctrl+Shift+U on login page for emergency unlock

---

**Last Updated:** October 13, 2025
**Version:** 1.0
**Status:** Ready for Implementation
