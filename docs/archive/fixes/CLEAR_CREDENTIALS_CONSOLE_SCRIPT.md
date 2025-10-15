# Clear Hardcoded Credentials - Console Script

## Instructions

1. Open Phaeton AI CRM in your browser (http://localhost:3001)
2. Open browser console (F12 or Ctrl+Shift+I)
3. Paste the entire script below and press Enter
4. Refresh the page
5. Go to Settings > API Configuration and enter YOUR keys

## Console Script

```javascript
// Clear Hardcoded Credentials Script
console.log('🔍 Scanning for hardcoded credentials...');

const HARDCODED_VALUES = {
  apiKey: 'key_c3f084f5ca67781070e188b47d7f',
  callAgentId: 'agent_447a1b9da540237693b0440df6',
  smsAgentId: 'agent_643486efd4b5a0e9d7e094ab99'
};

let clearedCount = 0;
let foundKeys = [];

// Scan all localStorage keys
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);

  if (key && key.startsWith('settings_')) {
    const value = localStorage.getItem(key);

    try {
      const settings = JSON.parse(value);
      let modified = false;

      // Check for hardcoded API key
      if (settings.retellApiKey === HARDCODED_VALUES.apiKey) {
        console.log(`❌ Found hardcoded API key in: ${key}`);
        delete settings.retellApiKey;
        modified = true;
        foundKeys.push(key);
      }

      // Check for hardcoded Call Agent ID
      if (settings.callAgentId === HARDCODED_VALUES.callAgentId) {
        console.log(`❌ Found hardcoded Call Agent ID in: ${key}`);
        delete settings.callAgentId;
        modified = true;
      }

      // Check for hardcoded SMS Agent ID
      if (settings.smsAgentId === HARDCODED_VALUES.smsAgentId) {
        console.log(`❌ Found hardcoded SMS Agent ID in: ${key}`);
        delete settings.smsAgentId;
        modified = true;
      }

      // Save changes if any hardcoded values were found
      if (modified) {
        localStorage.setItem(key, JSON.stringify(settings));
        clearedCount++;
        console.log(`✅ Cleared hardcoded credentials from: ${key}`);
      }

    } catch (e) {
      console.error(`Error processing ${key}:`, e);
    }
  }
}

console.log('\n' + '='.repeat(50));
if (clearedCount > 0) {
  console.log(`✅ SUCCESS! Cleared hardcoded credentials from ${clearedCount} localStorage key(s)`);
  console.log('Keys cleared:', foundKeys);
  console.log('\n🔄 Please refresh the page now!');
} else {
  console.log('✅ No hardcoded credentials found in localStorage');
}
console.log('='.repeat(50));
```

## After Running Script

1. You should see: `✅ SUCCESS! Cleared hardcoded credentials from X localStorage key(s)`
2. Refresh the page (F5 or Ctrl+R)
3. Navigate to Dashboard - should show error: "No API key configured"
4. Go to Settings > API Configuration
5. Enter YOUR own API keys
6. Dashboard will now load YOUR data only
