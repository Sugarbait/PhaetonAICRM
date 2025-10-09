# ARTLEE CRM - Hostinger Deployment Guide

## ✅ Production Build Completed

Your production-ready files are in the `dist` folder and ready to upload to Hostinger.

---

## 📦 What's Included in the Build

### Core Files
- ✅ **index.html** - Main entry point with CSP headers
- ✅ **runtime-config.js** - Supabase credentials (pre-configured for ARTLEE tenant)
- ✅ **assets/** - Optimized JavaScript and CSS bundles
- ✅ **images/** - All image assets including favicon
- ✅ **manifest.json** - PWA configuration for ARTLEE Business CRM
- ✅ **sw.js** - Service worker for offline functionality
- ✅ **404.html** - SPA fallback for client-side routing
- ✅ **staticwebapp.config.json** - Server configuration with security headers

### New Cross-Device Features
- ✅ **Dynamic Favicon System** - Syncs across all devices
- ✅ **Logo Management** - Cross-device logo synchronization via Supabase
- ✅ **Tenant Isolation** - ARTLEE logos separate from other tenants

---

## 🚀 Hostinger Upload Instructions

### Step 1: Access File Manager
1. Log in to your Hostinger control panel
2. Navigate to **File Manager** or use **FTP client** (FileZilla recommended)
3. Go to your domain's public directory (usually `public_html` or `www`)

### Step 2: Backup Existing Files (if any)
```bash
# If you have existing files, rename the folder
public_html → public_html_backup_[date]
```

### Step 3: Upload Files
**Upload ALL files from the `dist` folder to your public directory:**

```
dist/                           → public_html/
├── assets/                     → assets/
├── images/                     → images/
├── index.html                  → index.html
├── runtime-config.js           → runtime-config.js
├── manifest.json               → manifest.json
├── manifest.webmanifest        → manifest.webmanifest
├── sw.js                       → sw.js
├── workbox-42774e1b.js        → workbox-42774e1b.js
├── registerSW.js               → registerSW.js
├── 404.html                    → 404.html
├── staticwebapp.config.json    → staticwebapp.config.json
├── robots.txt                  → robots.txt
├── vite.svg                    → vite.svg
└── emergency-unlock.html       → emergency-unlock.html
```

### Step 4: Set File Permissions
Ensure correct permissions:
- **Folders:** 755 (read, write, execute for owner; read, execute for others)
- **Files:** 644 (read, write for owner; read for others)

---

## 🔧 Hostinger Server Configuration

### Required Settings in .htaccess

If not already present, create/update `.htaccess` file in your public directory:

```apache
# ARTLEE CRM - Hostinger Configuration

# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# SPA Routing - Redirect all requests to index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rewrite everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()"

  # CORS for Supabase
  Header always set Access-Control-Allow-Origin "https://cpkslvmydfdevdftieck.supabase.co"
  Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/json "access plus 1 week"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Prevent directory browsing
Options -Indexes

# Block access to sensitive files
<FilesMatch "^\.">
  Order allow,deny
  Deny from all
</FilesMatch>
```

---

## 🔐 Environment Configuration

### Supabase Credentials (Already Configured)
The `runtime-config.js` file contains:
```javascript
window.RUNTIME_CONFIG = {
  SUPABASE_URL: 'https://cpkslvmydfdevdftieck.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGci...', // Full key already in file
  TENANT_ID: 'artlee'
}
```

✅ **No additional configuration needed** - credentials are hardcoded for Hostinger deployment.

---

## 🧪 Post-Deployment Testing

### 1. Verify Upload
Visit your domain: `https://yourdomain.com`
- ✅ Page loads without errors
- ✅ Logo appears in header (if uploaded)
- ✅ Favicon shows in browser tab

### 2. Test Authentication
1. **Login Page**:
   - ✅ Login form displays correctly
   - ✅ Can login with test@test.com

2. **Database Connection**:
   - ✅ Console shows "✅ Supabase initialized successfully"
   - ✅ No CORS errors in browser console

3. **Cross-Device Features**:
   - ✅ Upload logo in Settings → displays on login page
   - ✅ Upload favicon → updates browser tab icon
   - ✅ Login on different device → same logo/favicon appears

### 3. Test Core Features
- ✅ **Dashboard** - Loads with metrics
- ✅ **Calls Page** - Displays call data (requires MFA)
- ✅ **SMS Page** - Displays SMS data (requires MFA)
- ✅ **Settings** - Can update profile and upload logos
- ✅ **User Management** - Super Users can manage users

### 4. Browser Console Check
Open browser console (F12) and verify:
```
✅ No 404 errors on assets
✅ No CORS errors
✅ "✅ Supabase initialized successfully"
✅ "✅ Favicon updated: [url]"
✅ "Basic security systems, favicon, and cross-device sync initialized successfully"
```

---

## 🔍 Troubleshooting

### Issue: White Screen / Blank Page
**Solution:**
1. Check browser console for errors
2. Verify all files uploaded correctly
3. Ensure `.htaccess` has SPA routing rules
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: Login Not Working
**Solution:**
1. Open browser console
2. Look for "Supabase initialized" message
3. Check if CORS errors present
4. Verify `runtime-config.js` exists and is accessible
5. Try emergency unlock: `https://yourdomain.com/emergency-unlock.html`

### Issue: Logo/Favicon Not Appearing
**Solution:**
1. Upload logo via Settings → General → Company Logos
2. Wait 2-3 seconds for Supabase sync
3. Refresh page (or open new tab to test cross-tab sync)
4. Check browser console for "✅ Favicon updated" message

### Issue: 404 Errors on Page Refresh
**Solution:**
1. Verify `.htaccess` file exists in public directory
2. Check that mod_rewrite is enabled on your Hostinger plan
3. Contact Hostinger support to enable URL rewriting if needed

### Issue: Assets Not Loading
**Solution:**
1. Verify folder structure: `assets/` folder should be at root level
2. Check file permissions: folders 755, files 644
3. Clear browser cache completely
4. Check Network tab in browser console for actual error codes

---

## 📊 Performance Optimization (Already Included)

The build includes:
- ✅ **Code Splitting** - Vendor and app bundles separated
- ✅ **Minification** - JavaScript and CSS minified with Terser
- ✅ **Compression** - Gzip compression enabled via .htaccess
- ✅ **Lazy Loading** - Components load on demand
- ✅ **PWA Caching** - Service worker caches assets
- ✅ **Image Optimization** - All images optimized

**Build Metrics:**
```
Total Size: ~2.5 MB
Gzipped:    ~670 KB
Load Time:  1-3 seconds (on good connection)
```

---

## 🔄 Future Updates

### To Update the Site:
1. Make changes locally
2. Run `npm run build`
3. Upload new `dist` folder contents to Hostinger
4. **Important:** Don't delete `runtime-config.js` - it contains your credentials

### Automatic Backups:
Consider setting up Hostinger automatic backups:
1. Hostinger Panel → Backups
2. Enable daily/weekly backups
3. Restore point before each major update

---

## 🆘 Emergency Recovery

### If Site Goes Down:
1. **Emergency Unlock Page**:
   ```
   https://yourdomain.com/emergency-unlock.html
   ```
   - Opens browser console with unlock commands
   - Can clear locked accounts

2. **Force Logout All Users**:
   ```javascript
   // Run in browser console
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

3. **Database Access**:
   - Supabase Dashboard: https://supabase.com/dashboard
   - Project: cpkslvmydfdevdftieck
   - Can manually update user data if needed

---

## ✅ Deployment Checklist

Before going live, verify:

- [ ] All files uploaded to Hostinger public directory
- [ ] `.htaccess` file created with SPA routing rules
- [ ] SSL certificate active (HTTPS working)
- [ ] Test login with existing user account
- [ ] Verify dashboard loads with real data
- [ ] Test logo upload and cross-device sync
- [ ] Test favicon upload and browser tab update
- [ ] Check browser console for errors
- [ ] Test on mobile device
- [ ] Test user registration (if enabled)
- [ ] Verify MFA setup works correctly
- [ ] Test emergency unlock page

---

## 📞 Support Resources

### Hostinger Support:
- Live Chat: Available 24/7 in Hostinger panel
- Knowledge Base: https://support.hostinger.com
- Email: support@hostinger.com

### Supabase Support:
- Dashboard: https://supabase.com/dashboard
- Documentation: https://supabase.com/docs
- Support: support@supabase.io

### Application Issues:
- Check browser console for error messages
- Review HOSTINGER_DEPLOYMENT.md for detailed troubleshooting
- Test emergency unlock tools if authentication fails

---

## 🎉 Your Site is Ready!

The `dist` folder contains everything you need. Simply upload all files to your Hostinger server and your ARTLEE CRM will be live with full cross-device logo and favicon support!

**Production URL:** Your Hostinger domain
**Admin Access:** First registered user gets Super User role automatically
**Security:** All connections encrypted with HTTPS
**Backup:** Logos and favicons stored in Supabase (automatic cloud backup)

---

**Last Updated:** 2025-01-10
**Build Version:** 1.1.0
**Production Ready:** ✅ YES
