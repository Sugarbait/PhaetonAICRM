// Clear Hardcoded Credentials Script
// Copy this ENTIRE file and paste into browser console on localhost:3001

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
