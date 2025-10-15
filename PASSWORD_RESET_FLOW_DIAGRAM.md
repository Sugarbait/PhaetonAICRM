# Password Reset Flow Diagram - Phaeton AI CRM

## Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PASSWORD RESET FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Login Page   │
│              │
│ [Forgot      │
│  password?]  │◄─── User clicks "Forgot password?" link
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ RequestPasswordReset │
│ Page                 │
│                      │
│ Enter email:         │
│ [____________]       │
│                      │
│ [Send Reset Email]   │◄─── User enters email
└──────┬───────────────┘
       │
       │ Submits form
       ▼
┌────────────────────────────────────────────┐
│ Supabase Auth API                          │
│                                            │
│ supabase.auth.resetPasswordForEmail()      │
│                                            │
│ • Validates email exists                   │
│ • Generates secure token                   │
│ • Creates reset link with token            │
│ • Stores token with 1-hour expiry          │
└────────┬───────────────────────────────────┘
         │
         │ Token generated
         ▼
┌────────────────────────────────────────────┐
│ Supabase SMTP Handler                      │
│                                            │
│ Connects to: smtp.hostinger.com:465       │
│ From: aibot@phaetonai.com                 │
│                                            │
│ • Loads email template                     │
│ • Injects token into {{ .ConfirmationURL }}│
│ • Sends via Hostinger SMTP                 │
└────────┬───────────────────────────────────┘
         │
         │ Email sent
         ▼
┌────────────────────────────────────────────┐
│ User's Email Inbox                         │
│                                            │
│ From: Phaeton AI CRM <aibot@phaetonai.com>│
│ Subject: Reset Your Password               │
│                                            │
│ ┌────────────────────────────┐            │
│ │  [Reset Password Button]   │◄─── User clicks button
│ └────────────────────────────┘            │
│                                            │
│ Link: https://carexps.nexasync.ca/        │
│       reset-password?token=abc123...       │
└────────┬───────────────────────────────────┘
         │
         │ Clicks link
         ▼
┌────────────────────────────────────────────┐
│ ResetPasswordPage                          │
│                                            │
│ New Password:                              │
│ [__________________] 👁                    │
│ [████████░░] Strong                        │
│                                            │
│ Confirm Password:                          │
│ [__________________] ✓ Matches             │
│                                            │
│ [Reset Password]                           │◄─── User enters new password
└────────┬───────────────────────────────────┘
         │
         │ Submits form
         ▼
┌────────────────────────────────────────────┐
│ Supabase Auth API                          │
│                                            │
│ supabase.auth.updateUser()                 │
│                                            │
│ • Validates token not expired              │
│ • Validates token not used                 │
│ • Validates password strength              │
│ • Hashes new password                      │
│ • Updates user record                      │
│ • Marks token as used                      │
└────────┬───────────────────────────────────┘
         │
         │ Password updated
         ▼
┌────────────────────────────────────────────┐
│ Database: password_reset_audit             │
│                                            │
│ INSERT INTO password_reset_audit           │
│ (user_id, email, status, completed_at)     │
│ VALUES (..., 'completed', NOW())           │
│                                            │
│ UPDATE user_profiles                       │
│ SET password_last_changed = NOW()          │
└────────┬───────────────────────────────────┘
         │
         │ Audit logged
         ▼
┌────────────────────────────────────────────┐
│ Success Screen                             │
│                                            │
│ ✓ Password Reset Complete!                │
│                                            │
│ Your password has been successfully reset. │
│ Redirecting to login...                    │
│                                            │
│ [Go to Login Now]                          │
└────────┬───────────────────────────────────┘
         │
         │ Auto-redirect after 3 seconds
         ▼
┌────────────────────────────────────────────┐
│ Login Page                                 │
│                                            │
│ Email: user@example.com                    │
│ Password: [new password]                   │
│                                            │
│ [Sign In] ◄─── User logs in with new      │
└────────────────────────────────────────────┘    password
```

---

## Component Interaction Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                     COMPONENT ARCHITECTURE                     │
└───────────────────────────────────────────────────────────────┘

Frontend (React)              Backend (Supabase)         External (SMTP)
─────────────────             ──────────────────         ────────────────

┌──────────────┐              ┌─────────────┐
│ LoginPage    │              │             │
│ .tsx         │              │             │
└──────┬───────┘              │             │
       │                      │             │
       │ Link click           │             │
       ▼                      │             │
┌──────────────────┐          │             │
│ RequestPassword  │          │             │
│ ResetPage.tsx    │          │  Supabase   │
└──────┬───────────┘          │   Auth      │
       │                      │   API       │
       │ resetPasswordForEmail│             │
       └─────────────────────►│             │
                              │             │         ┌──────────────┐
                              │ Generate    │         │  Hostinger   │
                              │ Token       │         │   SMTP       │
                              │             ├────────►│  Server      │
                              │             │ Send    │              │
                              │             │ Email   └──────┬───────┘
                              │             │                │
                              │             │                │
                              └─────┬───────┘                │
                                    │                        │
                                    │ Token in URL           │ Email
                                    │                        │ delivered
┌──────────────────┐                │                        │
│ ResetPassword    │◄───────────────┘                        │
│ Page.tsx         │                                         │
└──────┬───────────┘                                         ▼
       │                              ┌─────────────┐   ┌────────────┐
       │ updateUser(password)         │             │   │ User Email │
       └─────────────────────────────►│  Supabase   │   │  Inbox     │
                                      │   Auth      │   └────────────┘
                                      │   API       │
                                      │             │
                                      └─────┬───────┘
                                            │
                                            │ Password
                                            │ updated
                                            ▼
                                      ┌─────────────┐
                                      │ PostgreSQL  │
                                      │             │
                                      │ • users     │
                                      │ • password_ │
                                      │   reset_    │
                                      │   audit     │
                                      └─────────────┘
```

---

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                               │
└────────────────────────────────────────────────────────────────┘

Step 1: Request Password Reset
───────────────────────────────

User Email Input ──► Supabase Auth ──► Database
                     (validate)         (lookup user)
                                              │
                                              ▼
                                        User exists?
                                       ┌────────────┐
                                       │   YES      │   NO
                                       ▼            ▼
                              Generate Token    Silent fail
                              Store in DB       (security)
                              Send email


Step 2: Email Delivery
──────────────────────

Token + URL ──► Email Template ──► SMTP Server ──► User Inbox
                (inject token)     (Hostinger)
                                         │
                                         ▼
                              Email contains:
                              https://carexps.nexasync.ca/
                              reset-password?token=abc123...


Step 3: Token Validation
────────────────────────

User clicks link ──► App loads ──► Supabase validates token
                                        │
                                        ▼
                                   Token valid?
                                  ┌──────────────┐
                                  │ YES    │  NO │
                                  ▼        ▼     ▼
                           Show reset  Error: Token
                           form        expired/invalid


Step 4: Password Update
───────────────────────

New Password ──► Validation ──► Supabase Auth ──► Database
                 (strength)     (hash password)   (update)
                                                      │
                                                      ▼
                                                   Success
                                                      │
                                                      ▼
                                              Log to audit table
                                              Update user_profiles
                                              Mark token as used
```

---

## Security Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    SECURITY CHECKS                             │
└────────────────────────────────────────────────────────────────┘

Request Phase:
──────────────
Email Input
    │
    ▼
┌─────────────────┐
│ Rate Limiting   │ ◄── Supabase built-in (per IP)
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Email Validation│ ◄── Format check
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ User Lookup     │ ◄── Database query
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Token Generation│ ◄── Cryptographically secure random
└─────┬───────────┘     (Supabase handles)
      │
      ▼
┌─────────────────┐
│ Token Storage   │ ◄── Stored with 1-hour expiry
└─────────────────┘


Reset Phase:
───────────
Token in URL
    │
    ▼
┌─────────────────┐
│ Token Validation│ ◄── Check exists in database
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Expiry Check    │ ◄── created_at + 1 hour > now?
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Usage Check     │ ◄── Token not already used?
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Password Input  │
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Strength Check  │ ◄── Min 8 chars, complexity
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Match Check     │ ◄── Password === Confirm
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Password Hashing│ ◄── Bcrypt (Supabase handles)
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Database Update │ ◄── Transaction (atomic)
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Token Invalidate│ ◄── Mark as used (prevents reuse)
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Audit Log       │ ◄── Record in password_reset_audit
└─────────────────┘
```

---

## Error Handling Flow

```
┌────────────────────────────────────────────────────────────────┐
│                      ERROR SCENARIOS                           │
└────────────────────────────────────────────────────────────────┘

Request Errors:
──────────────

Invalid Email Format
    │
    ▼
Show error: "Please enter a valid email address"


Email Not Found
    │
    ▼
Show success (security best practice)
No email sent (prevent enumeration)


SMTP Error
    │
    ▼
Log error to console
Show: "Failed to send email. Please try again."


Rate Limit Exceeded
    │
    ▼
Show: "Too many requests. Please try again later."


Reset Errors:
─────────────

Token Expired (> 1 hour)
    │
    ▼
Show: "Reset link has expired. Please request a new one."
Redirect to request page


Token Not Found
    │
    ▼
Show: "Invalid reset link. Please request a new one."


Token Already Used
    │
    ▼
Show: "This reset link has already been used."
Redirect to request page


Weak Password
    │
    ▼
Disable submit button
Show strength indicator: "Weak"


Password Mismatch
    │
    ▼
Show: "Passwords do not match"
Disable submit button


Database Error
    │
    ▼
Log to console
Show: "An error occurred. Please try again."
```

---

## Timeline Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        TIMELINE                                │
└────────────────────────────────────────────────────────────────┘

T+0s    User clicks "Forgot password?"
        ────────────────────────────────────►
        RequestPasswordResetPage loads

T+5s    User enters email and submits
        ────────────────────────────────────►
        API call to Supabase

T+7s    Supabase generates token
        ────────────────────────────────────►
        Token stored in database

T+10s   SMTP connection established
        ────────────────────────────────────►
        Email sent to Hostinger

T+15s   Email delivered to inbox
        ────────────────────────────────────►
        User receives notification

T+30s   User opens email
        ────────────────────────────────────►
        Reads instructions

T+45s   User clicks reset link
        ────────────────────────────────────►
        ResetPasswordPage loads

T+60s   User enters new password
        ────────────────────────────────────►
        Strength indicator updates

T+75s   User confirms password and submits
        ────────────────────────────────────►
        API call to Supabase

T+80s   Password updated in database
        ────────────────────────────────────►
        Audit log created

T+82s   Success screen shown
        ────────────────────────────────────►
        "Password Reset Complete!"

T+85s   Auto-redirect to login
        ────────────────────────────────────►
        LoginPage loads

T+90s   User logs in with new password
        ────────────────────────────────────►
        Authentication successful


Token Expiration Timeline:
──────────────────────────

T+0        Token created
T+30m      Token still valid (30 min remaining)
T+59m      Token still valid (1 min remaining)
T+60m      Token EXPIRED ⚠️
T+60m+     Any reset attempt fails
```

---

## Component State Diagram

```
┌────────────────────────────────────────────────────────────────┐
│              COMPONENT STATE TRANSITIONS                       │
└────────────────────────────────────────────────────────────────┘

RequestPasswordResetPage States:
────────────────────────────────

┌──────────┐
│  Initial │
│  State   │
└────┬─────┘
     │
     │ User enters email
     ▼
┌──────────┐
│ Loading  │ ◄── isLoading: true
│  State   │     Button disabled
└────┬─────┘     Spinner shown
     │
     │ API response received
     ▼
┌──────────┐
│ Success  │ ◄── isSuccess: true
│  State   │     Show confirmation screen
└──────────┘     Email sent message


ResetPasswordPage States:
─────────────────────────

┌──────────┐
│  Initial │
│  State   │
└────┬─────┘
     │
     │ User types password
     ▼
┌──────────────┐
│ Typing State │ ◄── Real-time validation
│              │     Strength indicator updates
└────┬─────────┘     Match check runs
     │
     │ Password meets requirements
     ▼
┌──────────────┐
│ Valid State  │ ◄── Submit button enabled
│              │     Green checkmarks shown
└────┬─────────┘
     │
     │ User submits
     ▼
┌──────────────┐
│ Loading      │ ◄── isLoading: true
│ State        │     Button disabled
└────┬─────────┘     "Resetting..." text
     │
     │ API response
     ▼
┌──────────────┐
│ Success      │ ◄── isSuccess: true
│ State        │     Show success screen
└────┬─────────┘     Start 3-second timer
     │
     │ Timer expires
     ▼
┌──────────────┐
│ Redirect     │ ◄── navigate('/login')
└──────────────┘


Error States:
────────────

Any stage can transition to:

┌──────────────┐
│ Error State  │ ◄── error: string
│              │     Show error message
└────┬─────────┘     Keep form editable
     │
     │ User corrects and retries
     ▼
┌──────────────┐
│ Return to    │
│ Valid State  │
└──────────────┘
```

---

## Integration Points

```
┌────────────────────────────────────────────────────────────────┐
│                   SYSTEM INTEGRATION                           │
└────────────────────────────────────────────────────────────────┘

Existing Services Used:
──────────────────────

✓ generalToast (notifications)
    └─ Show success/error messages
    └─ User feedback during flow

✓ useCompanyLogos (branding)
    └─ Display company logo on pages
    └─ Consistent brand experience

✓ supabase client (config/supabase.ts)
    └─ Auth API calls
    └─ Database operations

✓ React Router (navigation)
    └─ /request-password-reset route
    └─ /reset-password route
    └─ /update-password route


New Services Created:
────────────────────

✓ password_reset_audit (database)
    └─ Audit logging
    └─ Statistics tracking
    └─ Compliance reporting

✓ log_password_reset_attempt() (SQL function)
    └─ Create audit records
    └─ Track IP and user agent

✓ complete_password_reset() (SQL function)
    └─ Mark reset complete
    └─ Update user profile

✓ expire_old_password_resets() (SQL function)
    └─ Cleanup expired tokens
    └─ Maintenance automation


External Integrations:
─────────────────────

✓ Hostinger SMTP
    └─ Email delivery
    └─ Port 465 (SSL)
    └─ aibot@phaetonai.com

✓ Supabase Auth
    └─ Token generation
    └─ Password hashing
    └─ User management

✓ Resend API (via Supabase)
    └─ Email sending
    └─ Template rendering
    └─ Delivery tracking
```

---

This visual documentation helps understand the complete flow of the password reset system from user interaction through to successful completion.

