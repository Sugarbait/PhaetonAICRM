# Clear Test Credentials from localStorage

## Problem

Your ARTLEE CRM has **test credentials** stored in localStorage that are causing 404 errors from Retell AI:

- API Key: `test_key_175979...` (starts with "test_key")
- Call Agent ID: `test_call_agent_1759791891379` (has timestamp in name)
- SMS Agent ID: `test_sms_agent_1759791891379` (has timestamp in name)

These are **NOT real Retell AI credentials** - they are placeholder values created during testing.

## Solution

You need to clear these test credentials from localStorage so you can enter your **REAL** Retell AI credentials.

---

## Step 1: Open Browser Console

1. Open ARTLEE CRM at `http://localhost:8001` (or your production URL)
2. Press **F12** or **Ctrl+Shift+I** to open Developer Tools
3. Click the **Console** tab

---

## Step 2: Run Cleanup Commands

Copy and paste **ALL** of these commands into the console:

```javascript
// Clear all credential storage locations
localStorage.removeItem('retell_credentials_backup');
localStorage.removeItem('__emergencyRetellCredentials');
localStorage.removeItem('__fallbackRetellConfig');
localStorage.removeItem('__retellCredentialsBackup');
sessionStorage.removeItem('retell_credentials_backup');

// Clear credentials from all user settings keys
Object.keys(localStorage).filter(k => k.startsWith('settings_')).forEach(k => {
  try {
    const settings = JSON.parse(localStorage.getItem(k) || '{}');
    if (settings.retellApiKey || settings.callAgentId || settings.smsAgentId) {
      delete settings.retellApiKey;
      delete settings.callAgentId;
      delete settings.smsAgentId;
      localStorage.setItem(k, JSON.stringify(settings));
      console.log('✅ Cleared credentials from', k);
    }
  } catch (error) {
    console.error('Error processing', k, error);
  }
});

// Clear window memory
delete window.__retellCredentialsBackup;

console.log('\n✅ All test credentials cleared from localStorage!');
console.log('📋 Next: Refresh the page (Ctrl+Shift+R)');
```

---

## Step 3: Hard Refresh the Page

After running the commands above:

1. Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac) to hard refresh
2. This clears the page cache and forces a fresh load

---

## Step 4: Enter Your REAL Retell AI Credentials

1. Go to **Settings** → **API Configuration**
2. The fields should now be **blank**
3. Enter your **REAL** Retell AI credentials:
   - **API Key**: Should start with `key_` (production) or `sk_` (secret key)
   - **Call Agent ID**: Should start with `agent_` (from your Retell AI dashboard)
   - **SMS Agent ID**: Should start with `agent_` (from your Retell AI dashboard)
4. Click **Save**

---

## Step 5: Verify Credentials Are Saved

1. Refresh the page again
2. Go back to Settings → API Configuration
3. Your credentials should still be there (not blank)
4. Check the browser console for logs:

```
🏢 [TENANT] getCurrentTenantId() called - Returning: "artlee"
✅ Credentials saved for tenant: artlee
```

---

## How to Find Your REAL Retell AI Credentials

If you don't have your Retell AI credentials:

1. **Log in to Retell AI Dashboard**: https://app.retellai.com
2. **API Key**:
   - Go to Settings → API Keys
   - Copy your API key (starts with `key_`)
3. **Call Agent ID**:
   - Go to Agents → Select your call agent
   - Copy the Agent ID from the URL or agent details
4. **SMS Agent ID**:
   - Go to Agents → Select your SMS agent
   - Copy the Agent ID from the URL or agent details

---

## Troubleshooting

### Problem: Credentials disappear after refresh
**Solution**: The credentials weren't saved to Supabase. Make sure you:
- Clicked the "Save" button in API Configuration
- Saw a success message after saving
- Check browser console for any errors

### Problem: Still getting 404 errors
**Solution**:
1. Verify your credentials are correct (copy them again from Retell AI dashboard)
2. Make sure your Agent IDs are for **your Retell AI account**, not example/test IDs
3. Check that your API key has proper permissions in Retell AI

### Problem: Don't see API Configuration section
**Solution**:
- Make sure you're logged in as a Super User
- Check that Settings page has loaded completely
- Try refreshing the page

---

## After Clearing Test Credentials

Once you've cleared the test credentials and entered your real ones:

- ✅ Dashboard will load real call/SMS data from your Retell AI account
- ✅ No more 404 errors
- ✅ Costs will reflect actual usage from your account
- ✅ All features will work with your real data

---

**Last Updated**: October 6, 2025
