# ARTLEE CRM - Hostinger Deployment Guide

## 📦 Pre-Deployment Checklist

Before deploying to Hostinger, ensure you have:

- ✅ Built the production version (files in `dist` folder)
- ✅ Hostinger hosting account with cPanel access
- ✅ Domain name configured (or using Hostinger subdomain)
- ✅ SSL certificate (free Let's Encrypt available in Hostinger)
- ✅ Supabase project credentials ready
- ✅ Retell AI credentials ready (optional - users can configure later)

---

## 🚀 Deployment Steps

### Step 1: Build Production Version

The production build is already complete. The `dist` folder contains all files needed for deployment.

**What's in the dist folder:**
- `index.html` - Main application entry point
- `assets/` - JavaScript, CSS, and image files
- `.htaccess` - Apache configuration for SPA routing
- `manifest.webmanifest` - PWA manifest
- `sw.js` - Service worker for offline functionality
- `favicon.png` - Site favicon
- `404.html` - Custom 404 page

### Step 2: Upload Files to Hostinger

**Option A: Using File Manager (Recommended)**

1. Log in to your Hostinger control panel (hPanel)
2. Navigate to **File Manager**
3. Go to `public_html` directory (or your domain's directory)
4. Delete default files (index.html, etc.) if present
5. Upload ALL files from the `dist` folder:
   - Select all files in `dist` folder
   - Upload to `public_html`
   - Ensure `.htaccess` is uploaded (show hidden files if needed)

**Option B: Using FTP**

1. Use an FTP client (FileZilla, WinSCP, etc.)
2. Connect to your Hostinger account:
   - Host: Your domain or ftp.yourdomain.com
   - Username: Your Hostinger FTP username
   - Password: Your Hostinger FTP password
   - Port: 21 (or 22 for SFTP)
3. Navigate to `public_html`
4. Upload all files from `dist` folder

### Step 3: Configure Environment Variables

**IMPORTANT:** You need to set up environment variables for the production environment.

**Create `.env.production` file in public_html:**

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Azure AD Authentication (REQUIRED)
VITE_AZURE_CLIENT_ID=your-azure-client-id
VITE_AZURE_TENANT_ID=your-azure-tenant-id

# Security (REQUIRED)
VITE_HIPAA_MODE=true
VITE_PHI_ENCRYPTION_KEY=your-phi-encryption-key
VITE_AUDIT_ENCRYPTION_KEY=your-audit-encryption-key

# App Configuration
VITE_APP_ENVIRONMENT=production
VITE_APP_URL=https://yourdomain.com

# Optional: Retell AI (Users can configure in Settings)
# VITE_RETELL_API_KEY=your-retell-api-key

# Optional: OpenAI for Help Chat
# VITE_OPENAI_API_KEY=your-openai-key
```

**Note:** Since Vite builds environment variables into the bundle at build time, you have two options:

1. **Rebuild with production variables** (Recommended):
   - Set environment variables in `.env.production` locally
   - Run `npm run build` again
   - Upload the new build

2. **Use runtime configuration** (Alternative):
   - Modify `index.html` to inject variables at runtime
   - Not recommended for security-sensitive values

### Step 4: Configure SSL Certificate

1. In Hostinger hPanel, go to **SSL**
2. Select your domain
3. Click **Install SSL** (uses free Let's Encrypt)
4. Wait for SSL activation (usually instant)

Once SSL is active, uncomment the HTTPS redirect in `.htaccess`:

```apache
# Uncomment these lines to force HTTPS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

### Step 5: Configure Supabase for Your Domain

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > URL Configuration**
3. Add your Hostinger domain to **Site URL**: `https://yourdomain.com`
4. Add redirect URLs:
   - `https://yourdomain.com`
   - `https://yourdomain.com/dashboard`
   - `https://yourdomain.com/login`

### Step 6: Test the Deployment

1. Visit your domain: `https://yourdomain.com`
2. Verify the login page loads correctly
3. Test user registration:
   - First user should automatically become Super User
   - Check that blank logo space appears (no pre-loaded logos)
   - Verify API configuration fields are empty
4. Test navigation (Dashboard, Calls, SMS, Settings)
5. Test profile settings save
6. Test API configuration save
7. Verify MFA setup if enabled

---

## 🔧 Troubleshooting

### Issue: "Cannot find module" or blank screen

**Solution:**
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console for errors
- Verify all files uploaded correctly
- Check `.htaccess` file exists and is configured properly

### Issue: 404 errors on page refresh

**Solution:**
- Verify `.htaccess` file is in `public_html`
- Check that `mod_rewrite` is enabled (contact Hostinger support if needed)
- Ensure `.htaccess` has correct SPA routing configuration

### Issue: Environment variables not working

**Solution:**
- Rebuild locally with `.env.production` file containing your variables
- Upload the new build
- Environment variables are baked into the bundle at build time

### Issue: CORS errors or API failures

**Solution:**
- Check Supabase URL configuration
- Verify CORS settings in Supabase project
- Ensure your domain is added to allowed origins

### Issue: SSL/HTTPS redirect not working

**Solution:**
- Verify SSL certificate is active in Hostinger hPanel
- Uncomment HTTPS redirect in `.htaccess`
- Clear browser cache and test in incognito mode

### Issue: Service Worker errors

**Solution:**
- Service workers only work over HTTPS
- Ensure SSL is properly configured
- Clear service worker cache in browser DevTools

---

## 📋 Post-Deployment Configuration

### For First User (Super User):

1. **Register Account:**
   - Go to `/register`
   - Create account with email/password
   - First user automatically becomes Super User

2. **Upload Company Logo:**
   - Go to Settings > Profile
   - Upload header logo (appears on login page)
   - Upload favicon (browser tab icon)

3. **Configure API Credentials:**
   - Go to Settings > API Configuration
   - Enter Retell AI API Key
   - Enter Call Agent ID
   - Enter SMS Agent ID (optional)
   - Click Save

4. **Set Up MFA (Recommended):**
   - Go to Settings > Security
   - Enable Multi-Factor Authentication
   - Scan QR code with authenticator app
   - Save backup codes

### For Additional Users:

1. Super User invites users via Settings > User Management
2. New users register and wait for Super User approval
3. Each user configures their own profile and preferences

---

## 🔒 Security Recommendations

1. **Enable SSL:** Always use HTTPS for production
2. **Configure CSP:** Content Security Policy headers in `.htaccess`
3. **Regular Updates:** Keep dependencies updated with `npm audit fix`
4. **Backup Database:** Regular Supabase backups
5. **Monitor Logs:** Check Supabase logs for suspicious activity
6. **Rotate Keys:** Change encryption keys periodically
7. **MFA Required:** Enforce MFA for all users

---

## 📊 Performance Optimization

1. **Enable Gzip:** Already configured in `.htaccess`
2. **Cache Control:** Configured for static assets
3. **CDN:** Consider Cloudflare for additional performance
4. **Image Optimization:** Compress uploaded logos
5. **Service Worker:** PWA caching for offline support

---

## 🆘 Support

### Hostinger Support:
- Live Chat: Available 24/7 in hPanel
- Knowledge Base: https://support.hostinger.com
- Email Support: Via hPanel ticket system

### Application Issues:
- Check browser console for errors
- Review CLAUDE.md for development guidance
- Verify Supabase connection and RLS policies

---

## 📝 Quick Reference

**Control Panel:** https://hpanel.hostinger.com
**File Manager:** hPanel > File Manager > public_html
**SSL Management:** hPanel > SSL
**Database:** Managed via Supabase (not Hostinger)

**Default Ports:**
- HTTP: 80
- HTTPS: 443
- FTP: 21
- SFTP: 22

**File Paths:**
- Application Root: `/public_html/`
- Index File: `/public_html/index.html`
- Assets: `/public_html/assets/`
- Config: `/public_html/.htaccess`

---

## ✅ Deployment Checklist

Before going live:

- [ ] SSL certificate active
- [ ] Domain DNS configured
- [ ] All files uploaded to public_html
- [ ] .htaccess file present and configured
- [ ] Supabase URL configuration updated
- [ ] Environment variables configured
- [ ] First user registered and confirmed Super User
- [ ] Logo uploaded and displaying
- [ ] API credentials configured (if using Retell AI)
- [ ] MFA tested and working
- [ ] All pages load correctly
- [ ] No console errors in production
- [ ] Service worker registered
- [ ] PWA installable
- [ ] Mobile responsive verified

---

**Deployment Status:** ✅ Ready for Hostinger
**Build Date:** October 4, 2025
**Application Version:** 1.0.0
**Template Type:** Master Template (Multi-Tenant Ready)

---

*For detailed development information, see CLAUDE.md*
*For master template usage, see the Master Template section in CLAUDE.md*
