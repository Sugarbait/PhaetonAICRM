// Test script to verify complete logout functionality
console.log('🧪 Testing Complete Logout Functionality...\n');

// Function to check for authentication-related keys
function checkAuthKeys() {
  const authKeys = {
    msal: [],
    credentials: [],
    user: [],
    session: [],
    other: []
  };

  // Check localStorage
  console.log('📦 Checking localStorage:');
  for (let key in localStorage) {
    if (key.startsWith('msal.') || key.includes('.msal')) {
      authKeys.msal.push(key);
    } else if (key.includes('credential') || key.includes('retell') || key.includes('api')) {
      authKeys.credentials.push(key);
    } else if (key.includes('user') || key.includes('User') || key === 'currentUser') {
      authKeys.user.push(key);
    } else if (key.includes('session') || key.includes('Session')) {
      authKeys.session.push(key);
    } else if (key.includes('token') || key.includes('auth') || key.includes('account')) {
      authKeys.other.push(key);
    }
  }

  // Check sessionStorage
  console.log('\n📦 Checking sessionStorage:');
  const sessionKeys = {
    msal: [],
    credentials: [],
    other: []
  };

  for (let key in sessionStorage) {
    if (key.startsWith('msal.') || key.includes('.msal')) {
      sessionKeys.msal.push(key);
    } else if (key.includes('credential') || key.includes('retell')) {
      sessionKeys.credentials.push(key);
    } else if (key.includes('token') || key.includes('auth') || key.includes('session')) {
      sessionKeys.other.push(key);
    }
  }

  // Report findings
  console.log('\n🔍 Authentication Keys Found:');
  console.log('================================');

  console.log('\n📁 localStorage:');
  console.log('  MSAL tokens:', authKeys.msal.length ? authKeys.msal : '✅ None found');
  console.log('  Credentials:', authKeys.credentials.length ? authKeys.credentials : '✅ None found');
  console.log('  User data:', authKeys.user.length ? authKeys.user : '✅ None found');
  console.log('  Sessions:', authKeys.session.length ? authKeys.session : '✅ None found');
  console.log('  Other auth:', authKeys.other.length ? authKeys.other : '✅ None found');

  console.log('\n📁 sessionStorage:');
  console.log('  MSAL tokens:', sessionKeys.msal.length ? sessionKeys.msal : '✅ None found');
  console.log('  Credentials:', sessionKeys.credentials.length ? sessionKeys.credentials : '✅ None found');
  console.log('  Other auth:', sessionKeys.other.length ? sessionKeys.other : '✅ None found');

  return {
    localStorage: authKeys,
    sessionStorage: sessionKeys
  };
}

// Function to check logout flag
function checkLogoutFlag() {
  const logoutFlag = localStorage.getItem('justLoggedOut');
  console.log('\n🚪 Logout Flag Status:');
  if (logoutFlag === 'true') {
    console.log('✅ justLoggedOut flag is set - prevents auto-login');
  } else {
    console.log('❌ justLoggedOut flag is NOT set');
  }
  return logoutFlag === 'true';
}

// Function to simulate logout cleanup
function simulateLogoutCleanup() {
  console.log('\n🧹 Simulating logout cleanup...');

  // Set logout flag
  localStorage.setItem('justLoggedOut', 'true');
  console.log('✅ Set justLoggedOut flag');

  // Clear MSAL tokens
  const msalKeys = Object.keys(localStorage).filter(key =>
    key.startsWith('msal.') || key.includes('.msal') || key.includes('account')
  );
  msalKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`  🗑️ Removed: ${key}`);
  });

  // Clear session storage
  const sessionMsalKeys = Object.keys(sessionStorage).filter(key =>
    key.startsWith('msal.') || key.includes('.msal')
  );
  sessionMsalKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`  🗑️ Removed from session: ${key}`);
  });

  // Clear user data
  localStorage.removeItem('currentUser');
  localStorage.removeItem('freshMfaVerified');
  localStorage.removeItem('mfa_verified');
  console.log('  🗑️ Cleared user data');

  // Clear credentials
  const credentialKeys = Object.keys(localStorage).filter(key =>
    key.includes('retell') || key.includes('credential') || key.includes('settings_')
  );
  credentialKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`  🗑️ Removed credential: ${key}`);
  });

  console.log('\n✅ Cleanup complete!');
}

// Main test execution
console.log('📊 BEFORE CLEANUP:');
console.log('==================');
const beforeState = checkAuthKeys();
const hasLogoutFlag = checkLogoutFlag();

// Show summary
const totalAuthKeys =
  beforeState.localStorage.msal.length +
  beforeState.localStorage.credentials.length +
  beforeState.localStorage.user.length +
  beforeState.localStorage.session.length +
  beforeState.localStorage.other.length +
  beforeState.sessionStorage.msal.length +
  beforeState.sessionStorage.credentials.length +
  beforeState.sessionStorage.other.length;

console.log('\n📈 Summary:');
console.log(`Total authentication-related keys found: ${totalAuthKeys}`);

if (totalAuthKeys > 0) {
  console.log('\n⚠️ WARNING: Authentication data found that could cause auto-login!');
  console.log('Run the following command to simulate a complete logout:');
  console.log('  simulateLogoutCleanup()');
} else {
  console.log('\n✅ No authentication data found - logout appears successful!');
}

// Export for console use
window.testLogout = {
  checkAuthKeys,
  checkLogoutFlag,
  simulateLogoutCleanup,
  recheck: () => {
    console.clear();
    console.log('🔄 RECHECKING STATE:');
    console.log('====================');
    checkAuthKeys();
    checkLogoutFlag();
  }
};

console.log('\n📝 Test functions available:');
console.log('  testLogout.checkAuthKeys() - Check for auth keys');
console.log('  testLogout.checkLogoutFlag() - Check logout flag');
console.log('  testLogout.simulateLogoutCleanup() - Clean all auth data');
console.log('  testLogout.recheck() - Recheck current state');