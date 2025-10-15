// Test script to verify Department, Phone, Location persistence on page refresh
console.log('🔧 PAGE REFRESH PERSISTENCE TEST: Starting profile field persistence test');

// Test data for profile fields
const testProfileData = {
  department: 'Oncology Department',
  phone: '+1 (555) 777-6666',
  location: 'Montreal, QC',
  bio: 'Oncology specialist with expertise in cancer treatment and research.',
  display_name: 'Dr. Refresh Test'
};

// Function to test page refresh persistence
async function testPageRefreshPersistence() {
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
    checkProfileFields(userData.id, 'BEFORE REFRESH');

    console.log('🔄 Step 4: Preparing for page refresh test...');

    // Save test data for verification after refresh
    localStorage.setItem('test_refresh_persistence_data', JSON.stringify({
      userId: userData.id,
      expectedData: testProfileData,
      timestamp: new Date().toISOString()
    }));

    console.log('✅ PAGE REFRESH PERSISTENCE TEST: Setup complete');
    console.log('📋 Next steps:');
    console.log('   1. Refresh the page (F5 or Ctrl+R)');
    console.log('   2. Go to Settings > Profile');
    console.log('   3. Check if Department, Phone, Location fields are still filled');
    console.log('   4. Check console for "AFTER REFRESH" verification');

    // Also test immediate simulation
    setTimeout(() => {
      console.log('🔄 Simulating immediate Settings page load...');
      simulateSettingsPageLoad(userData.id);
    }, 2000);

  } catch (error) {
    console.error('❌ Page refresh persistence test failed:', error);
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

// Function to simulate settings page load (mimics component behavior)
function simulateSettingsPageLoad(userId) {
  console.log('🎭 Simulating EnhancedProfileSettings component load...');

  // Step 1: Check localStorage first (new behavior)
  const currentUser = localStorage.getItem('currentUser');
  let localProfileData = null;

  if (currentUser) {
    const userData = JSON.parse(currentUser);
    if (userData.id === userId && (userData.department || userData.phone || userData.location)) {
      localProfileData = {
        name: userData.name || '',
        display_name: userData.display_name || userData.name || '',
        department: userData.department || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        location: userData.location || ''
      };
      console.log('✅ SIMULATION: Found localStorage data:', {
        department: localProfileData.department,
        phone: localProfileData.phone,
        location: localProfileData.location
      });
    }
  }

  // Also check userProfile storage
  if (!localProfileData || (!localProfileData.department && !localProfileData.phone && !localProfileData.location)) {
    const userProfile = localStorage.getItem(`userProfile_${userId}`);
    if (userProfile) {
      const profileData = JSON.parse(userProfile);
      if (profileData.department || profileData.phone || profileData.location) {
        localProfileData = {
          name: profileData.name || '',
          display_name: profileData.display_name || profileData.name || '',
          department: profileData.department || '',
          phone: profileData.phone || '',
          bio: profileData.bio || '',
          location: profileData.location || ''
        };
        console.log('✅ SIMULATION: Found userProfile storage data:', {
          department: localProfileData.department,
          phone: localProfileData.phone,
          location: localProfileData.location
        });
      }
    }
  }

  if (localProfileData) {
    console.log('🎯 SIMULATION RESULT: Profile fields would be loaded successfully!');
    console.log('📋 Fields that would appear in Settings > Profile:');
    console.log('   Department:', localProfileData.department || 'EMPTY');
    console.log('   Phone:', localProfileData.phone || 'EMPTY');
    console.log('   Location:', localProfileData.location || 'EMPTY');
    console.log('   Bio:', localProfileData.bio || 'EMPTY');
    console.log('   Display Name:', localProfileData.display_name || 'EMPTY');
  } else {
    console.warn('⚠️ SIMULATION RESULT: No profile fields would be loaded - fields would be empty');
  }
}

// Function to verify after page refresh
function verifyAfterPageRefresh() {
  console.log('🔍 AFTER REFRESH VERIFICATION: Checking if profile fields persisted...');

  const testData = localStorage.getItem('test_refresh_persistence_data');
  if (!testData) {
    console.log('⚠️  No test data found - test may not have been run before refresh');
    return;
  }

  const { userId, expectedData, timestamp } = JSON.parse(testData);
  console.log('📋 Expected test data from:', new Date(timestamp).toLocaleString());
  console.log('📋 Expected fields:', expectedData);

  // Check if fields are still present
  checkProfileFields(userId, 'AFTER REFRESH');

  // Simulate how the ProfileSettings component would load the data
  simulateSettingsPageLoad(userId);

  // Verify each field
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    const userData = JSON.parse(currentUser);
    const results = {};

    Object.keys(expectedData).forEach(field => {
      results[field] = userData[field] === expectedData[field] ? '✅ PASS' : '❌ FAIL';
    });

    console.log('📊 PAGE REFRESH PERSISTENCE TEST RESULTS:');
    Object.entries(results).forEach(([field, result]) => {
      console.log(`  ${field}: ${result}`);
    });

    const allPassed = Object.values(results).every(result => result.includes('PASS'));
    console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL FIELDS PERSISTED THROUGH REFRESH' : '❌ SOME FIELDS LOST ON REFRESH'}`);

    // Clean up test data
    localStorage.removeItem('test_refresh_persistence_data');

  } else {
    console.error('❌ No current user found after refresh');
  }
}

// Check if this is after page refresh verification
const testData = localStorage.getItem('test_refresh_persistence_data');
if (testData) {
  // This appears to be after page refresh, run verification
  setTimeout(() => {
    verifyAfterPageRefresh();
  }, 1000); // Wait 1 second for page to fully load
} else {
  // This is the initial test setup
  testPageRefreshPersistence();
}

// Cleanup - remove test script after 20 seconds
setTimeout(() => {
  const script = document.querySelector('script[src*="test-page-refresh-persistence.js"]');
  if (script) {
    script.remove();
  }
}, 20000);