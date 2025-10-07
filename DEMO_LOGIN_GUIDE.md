# MedEx CRM - Demo Login Guide

## 🎯 Demo Login System

MedEx now has a simple, clean demo login system with demo credentials displayed on the login page.

---

## 🔐 Demo Accounts

### 1. Admin Account (with MFA)
- **Email**: `admin@medex.com`
- **Password**: `admin123`
- **MFA Code**: `123456`
- **Role**: Super User
- **Features**: Full admin access with MFA protection

### 2. Regular User Account (no MFA)
- **Email**: `user@medex.com`
- **Password**: `user123`
- **MFA Code**: Not required
- **Role**: User
- **Features**: Standard user access without MFA

---

## 📋 How to Login

### Method 1: Manual Entry
1. Open http://localhost:3000
2. Enter email and password from the accounts above
3. If MFA is enabled, enter the MFA code: `123456`
4. Click "Sign In"

### Method 2: Auto-Fill (Quick)
1. Open http://localhost:3000
2. Click on any demo account card on the right side
3. Credentials will auto-fill
4. Click "Sign In"
5. Enter MFA code if required: `123456`

---

## 🔄 Login Flow

### For Admin Account (with MFA):
```
1. Enter: admin@medex.com / admin123
2. Click "Sign In"
3. MFA screen appears
4. Enter MFA code: 123456
5. Click "Verify MFA"
6. ✅ Logged in to dashboard
```

### For Regular User (no MFA):
```
1. Enter: user@medex.com / user123
2. Click "Sign In"
3. ✅ Logged in to dashboard (no MFA required)
```

---

## 📁 Files Created

### Demo Authentication Service
**File**: `src/services/demoAuthService.ts`
- Simple username/password authentication
- Fixed demo MFA code (123456)
- User role management
- No database required

### Simple Demo Login Page
**File**: `src/pages/SimpleDemoLoginPage.tsx`
- Clean, modern UI with MedEx branding
- Demo credentials displayed on login page
- Click-to-fill functionality
- MFA verification screen
- Mobile responsive

### Integration
- Updated `src/App.tsx` to use `SimpleDemoLoginPage`
- Replaced complex login logic with simple demo auth

---

## ✨ Features

### Login Page
- ✅ MedEx logo and branding
- ✅ Demo accounts displayed prominently
- ✅ Click-to-fill credentials
- ✅ Password visibility toggle
- ✅ Role badges (Super User, User)
- ✅ MFA status indicators
- ✅ Responsive design

### MFA Verification
- ✅ Simple 6-digit code entry
- ✅ Fixed demo code: `123456`
- ✅ Back to login option
- ✅ MFA code displayed on screen
- ✅ Error handling

### Security
- ✅ Only demo accounts can login
- ✅ Password validation
- ✅ MFA protection for admin
- ✅ Session storage
- ✅ Logout functionality

---

## 🚨 Important Notes

### This is a DEMO System
- **Purpose**: Testing and demonstration only
- **Security**: Simple authentication (not production-ready)
- **Data**: No real patient data should be used
- **Database**: Works without Supabase connection

### Demo vs Production
| Feature | Demo Mode | Production Mode |
|---------|-----------|-----------------|
| Authentication | Simple email/password | Azure AD with MSAL |
| MFA | Fixed code (123456) | TOTP with authenticator app |
| Database | Not required | Supabase required |
| Users | 2 hardcoded users | Dynamic from database |
| Passwords | Plain text | Hashed and encrypted |

---

## 🔧 Customization

### To Add More Demo Users
Edit: `src/services/demoAuthService.ts`

```typescript
const DEMO_USERS: DemoUser[] = [
  // ... existing users
  {
    id: 'demo-custom-001',
    email: 'custom@medex.com',
    password: 'custom123',
    name: 'Custom User',
    role: 'admin',
    mfaEnabled: false,
    mfaCode: ''
  }
]
```

### To Change MFA Code
Edit: `src/services/demoAuthService.ts`

```typescript
{
  id: 'demo-admin-001',
  // ...
  mfaCode: '999999' // Change from 123456 to your preferred code
}
```

---

## 🔄 Switching to Production Auth

When ready to deploy with real authentication:

1. **Set up Azure AD**:
   - Create app registration
   - Get Client ID and Tenant ID
   - Configure in `.env.local`

2. **Set up Supabase**:
   - Create database
   - Run migrations
   - Configure credentials

3. **Update App.tsx**:
   - Replace `SimpleDemoLoginPage` with `LoginPage`
   - The original login page supports Azure AD

4. **Remove demo files** (optional):
   - `src/services/demoAuthService.ts`
   - `src/pages/SimpleDemoLoginPage.tsx`

---

## 📖 Quick Reference

### Admin Login
```
Email:    admin@medex.com
Password: admin123
MFA Code: 123456
```

### User Login
```
Email:    user@medex.com
Password: user123
MFA Code: (not required)
```

### URLs
- **Dev Server**: http://localhost:3000
- **Login Page**: Automatically shown when not authenticated
- **Dashboard**: Shown after successful login

---

## ✅ Testing Checklist

Test these scenarios:

- [ ] Login with admin account
- [ ] Verify MFA prompt appears for admin
- [ ] Enter MFA code 123456
- [ ] Access dashboard as admin
- [ ] Logout
- [ ] Login with user account
- [ ] Verify no MFA prompt for user
- [ ] Access dashboard as user
- [ ] Test click-to-fill functionality
- [ ] Test password visibility toggle
- [ ] Test wrong password error
- [ ] Test wrong MFA code error
- [ ] Test back button from MFA screen

---

## 🎨 UI/UX Features

### Visual Design
- Gradient background (blue to indigo)
- Clean white cards
- Role-based badges
- MFA status indicators
- Hover effects on demo cards
- Responsive grid layout

### User Experience
- One-click credential fill
- Clear error messages
- Loading states
- Password toggle
- MFA code helper text
- Back navigation

---

**Demo Mode Active** ✅
**Production Ready**: Follow setup guide to configure real authentication

---

*Last Updated: January 2025*
*MedEx CRM v1.0 - Demo Environment*
