// Test script to verify Department, Phone, Location persistence across logout/login
console.log('🔧 LOGOUT/LOGIN PERSISTENCE TEST: Starting profile field persistence test');

// Test data for profile fields
const testProfileData = {
  department: 'Emergency Medicine',
  phone: '+1 (555) 999-8888',
  location: 'Vancouver, BC',
  bio: 'Emergency physician with 15 years of experience.',
  display_name: 'Dr. Emergency Test'
};

// Function to test logout/login persistence
async function testLogoutLoginPersistence() {
  try {
    console.log('🔍 Step 1: Checking current user before test...');

    // Get current user
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      console.error('❌ No current user found - please log in first');
      return;
    }

    const userData = JSON.parse(currentUser);
    console.log('✅ Found current user:', userData.email);

    console.log('📝 Step 2: Setting test profile data in localStorage...');

    // Update currentUser with test profile data
    const updatedUser = {
      ...userData,
      ...testProfileData,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    // Update userProfile storage
    localStorage.setItem(`userProfile_${userData.id}`, JSON.stringify(updatedUser));

    // Update systemUsers
    const systemUsers = localStorage.getItem('systemUsers');
    if (systemUsers) {
      const users = JSON.parse(systemUsers);
      const userIndex = users.findIndex(u => u.id === userData.id);
      if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], ...testProfileData, updated_at: new Date().toISOString() };
        localStorage.setItem('systemUsers', JSON.stringify(users));
      }
    }

    console.log('✅ Test profile data saved to all localStorage locations');

    console.log('🔍 Step 3: Verifying profile data is stored...');
    checkProfileFields(userData.id, 'BEFORE LOGOUT');

    console.log('🚪 Step 4: Simulating logout...');

    // Save test data to special persistence key before logout
    localStorage.setItem('test_profile_persistence_data', JSON.stringify({
      userId: userData.id,
      expectedData: testProfileData,
      timestamp: new Date().toISOString()
    }));

    // Add event listener for page reload (simulating login)
    window.addEventListener('beforeunload', () => {
      console.log('💾 Saving persistence test data before logout...');
    });

    console.log('✅ LOGOUT/LOGIN PERSISTENCE TEST: Setup complete');
    console.log('📋 Next steps:');
    console.log('   1. Manually log out of the application');
    console.log('   2. Log back in');
    console.log('   3. Check console for "AFTER LOGIN" verification');
    console.log('   4. Go to Settings > Profile to verify fields are present');

  } catch (error) {
    console.error('❌ Logout/login persistence test failed:', error);
  }
}

// Function to check profile fields
function checkProfileFields(userId, stage) {
  console.log(`🔍 Checking profile fields ${stage}:`);

  // Check currentUser
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    const userData = JSON.parse(currentUser);
    console.log('📂 currentUser profile fields:');
    console.log('  Department:', userData.department || 'NOT SET');
    console.log('  Phone:', userData.phone || 'NOT SET');
    console.log('  Location:', userData.location || 'NOT SET');
    console.log('  Bio:', userData.bio || 'NOT SET');
    console.log('  Display Name:', userData.display_name || 'NOT SET');
  }

  // Check userProfile
  const userProfile = localStorage.getItem(`userProfile_${userId}`);
  if (userProfile) {
    const profile = JSON.parse(userProfile);
    console.log('📂 userProfile profile fields:');
    console.log('  Department:', profile.department || 'NOT SET');
    console.log('  Phone:', profile.phone || 'NOT SET');
    console.log('  Location:', profile.location || 'NOT SET');
    console.log('  Bio:', profile.bio || 'NOT SET');
    console.log('  Display Name:', profile.display_name || 'NOT SET');
  }
}

// Function to verify after login
function verifyAfterLogin() {
  console.log('🔍 AFTER LOGIN VERIFICATION: Checking if profile fields persisted...');

  const testData = localStorage.getItem('test_profile_persistence_data');
  if (!testData) {
    console.log('⚠️  No test data found - test may not have been run before logout');
    return;
  }

  const { userId, expectedData, timestamp } = JSON.parse(testData);
  console.log('📋 Expected test data from:', new Date(timestamp).toLocaleString());
  console.log('📋 Expected fields:', expectedData);

  // Check if fields are still present
  checkProfileFields(userId, 'AFTER LOGIN');

  // Verify each field
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    const userData = JSON.parse(currentUser);
    const results = {};

    Object.keys(expectedData).forEach(field => {
      results[field] = userData[field] === expectedData[field] ? '✅ PASS' : '❌ FAIL';
    });

    console.log('📊 PERSISTENCE TEST RESULTS:');
    Object.entries(results).forEach(([field, result]) => {
      console.log(`  ${field}: ${result}`);
    });

    const allPassed = Object.values(results).every(result => result.includes('PASS'));
    console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL FIELDS PERSISTED' : '❌ SOME FIELDS LOST'}`);

    // Clean up test data
    localStorage.removeItem('test_profile_persistence_data');

  } else {
    console.error('❌ No current user found after login');
  }
}

// Check if this is after login verification
const testData = localStorage.getItem('test_profile_persistence_data');
if (testData) {
  // This appears to be after login, run verification
  setTimeout(() => {
    verifyAfterLogin();
  }, 2000); // Wait 2 seconds for login process to complete
} else {
  // This is the initial test setup
  testLogoutLoginPersistence();
}

// Cleanup - remove test script after 15 seconds
setTimeout(() => {
  const script = document.querySelector('script[src*="test-logout-login-persistence.js"]');
  if (script) {
    script.remove();
  }
}, 15000);