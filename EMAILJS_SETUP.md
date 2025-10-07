# EmailJS Setup Guide - Client-Side Email Notifications

**✅ Perfect for Azure Static Web Apps - No Backend Required!**

EmailJS allows you to send emails directly from your React app without needing a backend server. This works perfectly with Azure Static Web Apps because the email service runs entirely in the browser.

## Why EmailJS?

- ✅ **No Backend Needed**: Works with Azure Static Web Apps out-of-the-box
- ✅ **Free Tier**: 200 emails/month free forever
- ✅ **Domain Restricted**: API keys can be restricted to your domain (carexps.nexasync.ca)
- ✅ **CORS-Friendly**: Designed for browser-based use
- ✅ **Simple Integration**: Already implemented in your app

---

## Step 1: Create EmailJS Account

1. **Go to EmailJS Website**
   - Visit: https://www.emailjs.com/
   - Click **"Sign Up Free"**

2. **Create Account**
   - Email: Your email address
   - Password: Choose a strong password
   - Click **"Sign Up"**

3. **Verify Email**
   - Check your inbox
   - Click verification link

---

## Step 2: Add Email Service

1. **Go to Email Services**
   - Dashboard → **"Email Services"**
   - Click **"Add New Service"**

2. **Choose Email Provider**

   **Option A: Gmail (Easiest)**
   - Select **"Gmail"**
   - Click **"Connect Account"**
   - Sign in with your Gmail account
   - Grant permissions
   - Service ID will be auto-generated (e.g., `service_abc123`)

   **Option B: Outlook/Hotmail**
   - Select **"Outlook"**
   - Enter your Outlook email
   - Enter app password
   - Click **"Create Service"**

   **Option C: Custom SMTP (Hostinger)**
   - Select **"Other"**
   - **SMTP Server**: smtp.hostinger.com
   - **Port**: 465
   - **Username**: carexps@phaetonai.com
   - **Password**: Your Hostinger email password
   - Click **"Create Service"**

3. **Copy Service ID**
   - You'll see something like: `service_abc123xyz`
   - **Save this** - you'll need it for configuration

---

## Step 3: Create Email Template

1. **Go to Email Templates**
   - Dashboard → **"Email Templates"**
   - Click **"Create New Template"**

2. **Configure Template**

   **Subject:**
   ```
   {{app_name}}: {{notification_title}}
   ```

   **Content (HTML):**
   ```html
   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
     <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
       <h2>{{app_name}}</h2>
       <p>System Notification</p>
     </div>

     <div style="padding: 20px; background: #f0f9ff; border-left: 4px solid #2563eb; margin: 20px 0;">
       <h3>{{notification_title}}</h3>
       <p>{{notification_message}}</p>
       <p style="color: #6b7280; font-size: 12px;">
         <small>Time: {{timestamp}}</small>
       </p>
     </div>

     <div style="background: #f9fafb; padding: 15px; text-align: center; color: #6b7280;">
       <p>Secure Healthcare Communication Platform</p>
       <p style="font-size: 12px;">
         <strong>PRIVACY NOTICE:</strong> This notification contains no Protected Health Information (PHI).
       </p>
       <p style="font-size: 12px;">
         <a href="{{app_url}}">Visit Dashboard</a>
       </p>
     </div>
   </div>
   ```

   **To Email:**
   ```
   {{to_email}}
   ```

3. **Save Template**
   - Click **"Save"**
   - Copy the **Template ID** (e.g., `template_xyz789`)

---

## Step 4: Get Public Key

1. **Go to Account Settings**
   - Dashboard → **"Account"** → **"General"**

2. **Find Public Key**
   - Look for **"Public Key"** section
   - Copy the key (e.g., `AbCdEfGhIjKlMnOp`)

---

## Step 5: Configure Your Application

### **For Local Development** (`.env.local`)

Add these lines to your `.env.local` file:

```bash
# EmailJS Configuration (Client-Side Email)
VITE_EMAILJS_SERVICE_ID=service_abc123xyz
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=AbCdEfGhIjKlMnOp
```

### **For Azure Production**

Add these environment variables in Azure Static Web Apps Configuration:

1. Go to Azure Portal → Your Static Web App
2. Click **"Configuration"** → **"Application settings"**
3. Add these variables:
   - `VITE_EMAILJS_SERVICE_ID` = `service_abc123xyz`
   - `VITE_EMAILJS_TEMPLATE_ID` = `template_xyz789`
   - `VITE_EMAILJS_PUBLIC_KEY` = `AbCdEfGhIjKlMnOp`
4. Click **"Save"**
5. Redeploy your app (Azure will rebuild with new variables)

---

## Step 6: Restrict Domain Access (Security)

1. **Go to Security Settings**
   - Dashboard → **"Account"** → **"Security"**

2. **Add Allowed Origins**
   - Enable **"Check the origin"**
   - Add your domains:
     - `http://localhost:3000` (development)
     - `https://carexps.nexasync.ca` (production)
   - Click **"Save"**

This prevents other websites from using your EmailJS account.

---

## Step 7: Test the Integration

### **Test in Development**

1. Start your dev server: `npm run dev`
2. Open browser console
3. You should see: `✅ Client email service initialized (EmailJS)`

### **Send Test Email**

```typescript
import { clientEmailService } from '@/services/clientEmailService'

// Send test email
const result = await clientEmailService.sendTestEmail('your-email@example.com')

if (result.success) {
  console.log('✅ Test email sent!')
} else {
  console.error('❌ Failed:', result.error)
}
```

---

## Step 8: Update Email Notification Service

Now update your existing `emailNotificationService.ts` to use the client-side service:

```typescript
import { clientEmailService } from './clientEmailService'

// Replace server-side email calls with:
await clientEmailService.sendNotification(recipients, {
  type: 'newSMS',
  title: 'New SMS Received',
  message: 'You have received a new SMS message.',
  timestamp: new Date()
})
```

---

## Usage Examples

### **Send New SMS Notification**

```typescript
await clientEmailService.sendNotification(
  ['admin@example.com'],
  {
    type: 'newSMS',
    title: 'New SMS Message',
    message: 'A new SMS conversation has been started.',
    timestamp: new Date()
  }
)
```

### **Send Security Alert**

```typescript
await clientEmailService.sendNotification(
  ['security@example.com'],
  {
    type: 'securityAlert',
    title: 'Failed Login Attempt',
    message: 'Multiple failed login attempts detected from IP: 192.168.1.1',
    timestamp: new Date()
  }
)
```

### **Check Service Status**

```typescript
const status = clientEmailService.getStatus()
console.log('Email service available:', status.available)
console.log('Provider:', status.provider)
```

---

## Pricing & Limits

### **Free Tier**
- ✅ 200 emails/month
- ✅ Forever free
- ✅ No credit card required
- ✅ No expiration

### **Paid Plans** (if you need more)
- **Personal**: $7/month - 1,000 emails/month
- **Professional**: $15/month - 10,000 emails/month
- **Enterprise**: Custom pricing

---

## Troubleshooting

### **Error: "EmailJS not configured"**
**Solution:** Make sure all three environment variables are set:
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

### **Error: "Origin not allowed"**
**Solution:** Add your domain to allowed origins in EmailJS security settings

### **Error: "Template not found"**
**Solution:** Verify the template ID matches exactly (case-sensitive)

### **Error: "Service not found"**
**Solution:** Verify the service ID matches exactly

### **Emails not delivered**
**Solution:**
1. Check spam folder
2. Verify email service is connected in EmailJS dashboard
3. Check EmailJS dashboard for delivery status
4. Ensure sender email is verified (for Gmail/Outlook)

---

## Security Notes

✅ **Safe for Client-Side Use:**
- No PHI is sent in emails
- Only event notifications (titles and timestamps)
- API keys can be domain-restricted
- No sensitive credentials exposed

✅ **HIPAA Compliance:**
- Emails contain zero PHI
- Only notify of events (new SMS/call received)
- No patient names, addresses, or health information
- Compliant with minimum necessary standard

✅ **Best Practices:**
- Always restrict domain access in EmailJS settings
- Never include patient data in email content
- Use generic notification messages
- Monitor usage to stay within free tier limits

---

## Advantages Over Backend Solutions

| Feature | Client-Side (EmailJS) | Backend (Hostinger SMTP) |
|---------|----------------------|--------------------------|
| Azure Deployment | ✅ Works instantly | ❌ Requires Azure Functions |
| Setup Complexity | ⭐ Easy | ⭐⭐⭐ Complex |
| Cost | ✅ Free (200/month) | ❌ Requires paid hosting |
| Maintenance | ✅ Zero | ❌ Server management |
| Scalability | ✅ Auto-scales | ❌ Manual scaling |

---

## Summary

**You now have a client-side email solution that:**
- ✅ Works perfectly with Azure Static Web Apps
- ✅ Requires no backend server
- ✅ Is completely free (200 emails/month)
- ✅ Is secure and HIPAA-compliant (no PHI)
- ✅ Works in both development and production

**Next steps:**
1. Create EmailJS account
2. Add your email service (Gmail recommended)
3. Create email template
4. Copy Service ID, Template ID, and Public Key
5. Add to `.env.local` and Azure configuration
6. Test the integration

Need help? Check EmailJS documentation: https://www.emailjs.com/docs/