# 🔧 Fix Hostinger 404 Error - Dashboard Not Found

**Issue:** `GET https://phaetonai.nexasync.ca/dashboard 404 (Not Found)`

**Cause:** Missing `.htaccess` file for SPA routing

**Solution:** Upload `.htaccess` file to Hostinger

---

## ⚡ Quick Fix (2 Minutes):

### Step 1: Upload .htaccess to Hostinger

**Option A: Via Hostinger File Manager**

1. **Login to Hostinger**
   - Go to: https://hpanel.hostinger.com
   - Login with your credentials

2. **Navigate to File Manager**
   - Find your website in the dashboard
   - Click "File Manager" button

3. **Go to public_html**
   - Navigate to `public_html` folder (or wherever your site files are)

4. **Upload .htaccess**
   - Click "Upload" button (top right)
   - Select file from: `I:\Apps Back Up\Phaeton AI CRM\dist\.htaccess`
   - **OR** create a new file named `.htaccess` and paste the content below

5. **Verify File Uploaded**
   - Check that `.htaccess` appears in file list
   - If hidden, enable "Show Hidden Files" in File Manager settings

**Option B: Via FTP Client**

1. Connect to Hostinger via FTP
2. Navigate to `public_html`
3. Upload `dist/.htaccess` to root directory
4. Rename if needed to `.htaccess` (no extension)

---

## 📄 .htaccess File Content:

If you need to create the file manually in Hostinger File Manager:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Redirect all requests to index.html for SPA routing
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Enable CORS for API requests
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization"
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
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

---

## 🧪 Test the Fix:

### Step 2: Clear Cache and Test

1. **Clear Browser Cache**
   - Press `Ctrl + F5` (hard refresh)
   - Or clear cache in browser settings

2. **Test Navigation**
   - Go to: https://phaetonai.nexasync.ca/
   - Login to your account
   - Click Dashboard - should load without 404! ✅

3. **Test Direct URL**
   - Go directly to: https://phaetonai.nexasync.ca/dashboard
   - Should load correctly without 404 ✅

---

## 🎯 What This Fixes:

**Before:**
- ❌ 404 errors on `/dashboard`, `/settings`, `/calls`, `/sms`
- ❌ Refresh breaks the app
- ❌ Direct URL links don't work

**After:**
- ✅ All routes work correctly
- ✅ Refresh maintains current page
- ✅ Direct URLs load properly
- ✅ Bookmarks work
- ✅ Share links work

---

## 🔍 How It Works:

**The .htaccess file tells Apache:**
1. Check if requested file exists (like `dashboard.html`)
2. If NOT found, redirect to `index.html`
3. React Router handles the `/dashboard` route
4. App loads correctly!

**This is required for ALL Single Page Applications (SPAs)**

---

## 🆘 Troubleshooting:

### Issue: Still getting 404 after upload

**Solution 1: Check file name**
- File MUST be named `.htaccess` (starts with a dot)
- NO file extension (not `.htaccess.txt`)
- Check in File Manager: "Show Hidden Files" enabled

**Solution 2: Check file location**
- File MUST be in the same directory as `index.html`
- Usually `public_html` or root directory

**Solution 3: Check Apache mod_rewrite**
- Contact Hostinger support
- Ask: "Is mod_rewrite enabled for my account?"
- Most Hostinger plans have this enabled by default

### Issue: 500 Internal Server Error

**Solution:**
- Syntax error in .htaccess
- Copy the content exactly as shown above
- Check for extra spaces or characters

### Issue: Page loads but routing still broken

**Solution:**
- Clear browser cache completely
- Try incognito/private browsing mode
- Check console for JavaScript errors

---

## ✅ Success Checklist:

After uploading .htaccess:

- [ ] File uploaded to `public_html` directory
- [ ] File named exactly `.htaccess` (with dot)
- [ ] Cleared browser cache (`Ctrl+F5`)
- [ ] Can navigate to `/dashboard` without 404
- [ ] Refresh on `/dashboard` doesn't break app
- [ ] Direct URL `phaetonai.nexasync.ca/dashboard` works

---

## 📊 File Locations:

**Ready to upload:**
```
I:\Apps Back Up\Phaeton AI CRM\dist\.htaccess
```

**Included in future builds:**
```
I:\Apps Back Up\Phaeton AI CRM\public\.htaccess
```

---

## 🚀 Summary:

**Problem:** Server returns 404 for SPA routes like `/dashboard`
**Solution:** Upload `.htaccess` file with SPA routing rules
**Time:** 2 minutes
**Difficulty:** Easy (just upload one file)

**After upload:** All routes will work perfectly! ✅

---

*The .htaccess file is already created and ready in your `dist` folder - just upload it to Hostinger!*
