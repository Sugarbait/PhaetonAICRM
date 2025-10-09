# Hostinger Deployment Guide - ARTLEE CRM

## 📦 Deploy Updated Code to Hostinger

### Step 1: Upload the dist/ folder

1. Open Hostinger File Manager (or use FTP client like FileZilla)
2. Navigate to your website root directory (usually `public_html/`)
3. **DELETE the old files** in the website directory
4. **Upload ALL files from** `I:\Apps Back Up\ARTLEE CRM\dist\` folder to Hostinger

### Step 2: Clear browser cache and try again

- Press `Ctrl + Shift + Delete`
- Select "Cached images and files"  
- Click "Clear data"
- Go to your Hostinger website and try logging in

---

## 🚨 Emergency Unlock (if locked out)

1. Open `emergency-unlock.html` in your browser
2. Enter your email address
3. Click "Unlock My Account"
4. Try logging in again

---

## What Changed (October 8, 2025)

- ✅ Fixed authentication to use localStorage FIRST (more reliable on Hostinger)
- ✅ Updated branding from CareXPS to ARTLEE  
- ✅ Better error handling for Supabase failures

**Build Version:** artlee-business-crm@1.1.0
