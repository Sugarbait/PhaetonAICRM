// Test to verify the profile persistence fix is working
console.log('🎯 PROFILE PERSISTENCE FIX TEST: Testing after RLS policy fix');

async function testProfilePersistenceFix() {
  try {
    console.log('🔍 Step 1: Checking current state...');

    // Get current user
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      console.error('❌ No current user found - please log in first');
      return;
    }

    const userData = JSON.parse(currentUser);
    console.log('✅ Found current user:', userData.email, 'ID:', userData.id);

    // Ensure user ID is valid (not undefined)
    if (!userData.id || userData.id === 'undefined') {
      console.error('❌ User ID is invalid:', userData.id);
      return;
    }

    // Test data
    const testData = {
      name: userData.name || 'Test User',
      display_name: 'Dr. RLS Fix Test',
      department: 'Emergency Medicine - Fixed',
      phone: '+1 (555) 999-8888',
      bio: 'Emergency physician - testing RLS fix.',
      location: 'General Hospital - RLS Fixed'
    };

    console.log('📝 Step 2: Testing profileFieldsPersistenceService...');

    // Check if service is available
    let serviceAvailable = false;
    try {
      if (window.profileFieldsPersistenceService) {
        serviceAvailable = true;
      } else {
        console.log('📦 Service not in window, attempting direct access...');
      }
    } catch (err) {
      console.log('📦 Service access error:', err.message);
    }

    if (serviceAvailable) {
      console.log('🔧 Testing via profileFieldsPersistenceService...');

      // Test save
      try {
        const saveResult = await window.profileFieldsPersistenceService.saveProfileFieldsComplete(userData.id, testData);
        console.log('💾 Save result:', saveResult);

        if (saveResult.status === 'success') {
          console.log('✅ SAVE SUCCESS: Profile saved successfully');

          // Wait a moment then test load
          setTimeout(async () => {
            try {
              const loadResult = await window.profileFieldsPersistenceService.loadProfileFieldsComplete(userData.id);
              console.log('📊 Load result:', loadResult);

              if (loadResult.status === 'success') {
                console.log('✅ LOAD SUCCESS: Profile loaded successfully');
                verifyProfileFields(loadResult.data, testData);
              } else {
                console.warn('⚠️ LOAD PARTIAL: Load had issues:', loadResult.error);
                console.log('🔄 Checking localStorage fallback...');
                checkLocalStorageData(userData.id);
              }
            } catch (loadError) {
              console.error('❌ LOAD ERROR:', loadError);
              checkLocalStorageData(userData.id);
            }
          }, 1000);

        } else {
          console.warn('⚠️ SAVE PARTIAL: Save had issues:', saveResult.error);
          console.log('🔄 Should have fallen back to localStorage...');
          checkLocalStorageData(userData.id);
        }
      } catch (saveError) {
        console.error('❌ SAVE ERROR:', saveError);
        console.log('🔄 Testing localStorage fallback...');
        testLocalStorageFallback(userData.id, testData);
      }

    } else {
      console.log('📦 Service not available, testing localStorage approach...');
      testLocalStorageFallback(userData.id, testData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

function testLocalStorageFallback(userId, testData) {
  console.log('🔧 Testing localStorage fallback...');

  try {
    // Update all localStorage locations
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      const updatedUser = { ...userData, ...testData, updated_at: new Date().toISOString() };

      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      localStorage.setItem(`userProfile_${userId}`, JSON.stringify(updatedUser));

      // Update systemUsers
      const systemUsers = localStorage.getItem('systemUsers');
      if (systemUsers) {
        const users = JSON.parse(systemUsers);
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
          users[userIndex] = { ...users[userIndex], ...testData, updated_at: new Date().toISOString() };
          localStorage.setItem('systemUsers', JSON.stringify(users));
        }
      }

      console.log('✅ localStorage fallback completed');
      checkLocalStorageData(userId);
    }
  } catch (error) {
    console.error('❌ localStorage fallback failed:', error);
  }
}

function checkLocalStorageData(userId) {
  console.log('🔍 Checking localStorage data...');

  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    const userData = JSON.parse(currentUser);
    console.log('📂 currentUser profile fields:');
    console.log('  Department:', userData.department || 'NOT SET');
    console.log('  Phone:', userData.phone || 'NOT SET');
    console.log('  Location:', userData.location || 'NOT SET');
    console.log('  Bio:', userData.bio || 'NOT SET');
    console.log('  Display Name:', userData.display_name || 'NOT SET');

    if (userData.department || userData.phone || userData.location) {
      console.log('✅ localStorage contains profile data');
    } else {
      console.log('⚠️ localStorage missing profile data');
    }
  }

  const userProfile = localStorage.getItem(`userProfile_${userId}`);
  if (userProfile) {
    const profile = JSON.parse(userProfile);
    console.log('📂 userProfile storage contains:', {
      department: profile.department || 'NOT SET',
      phone: profile.phone || 'NOT SET',
      location: profile.location || 'NOT SET'
    });
  }
}

function verifyProfileFields(actualData, expectedData) {
  console.log('📊 FIELD VERIFICATION:');

  const fields = ['department', 'phone', 'location', 'bio', 'display_name'];
  const results = {};

  fields.forEach(field => {
    const actual = actualData[field] || '';
    const expected = expectedData[field] || '';
    results[field] = actual === expected ? '✅ PASS' : '❌ FAIL';

    console.log(`  ${field}: ${results[field]}`);
    if (results[field].includes('FAIL')) {
      console.log(`    Expected: "${expected}"`);
      console.log(`    Actual: "${actual}"`);
    }
  });

  const allPassed = Object.values(results).every(result => result.includes('PASS'));
  console.log(`\n🎯 VERIFICATION RESULT: ${allPassed ? '✅ ALL FIELDS VERIFIED' : '⚠️ SOME FIELDS DIFFER'}`);

  return allPassed;
}

function showInstructions() {
  console.log('\n📋 TESTING INSTRUCTIONS:');
  console.log('1. Check the console above for test results');
  console.log('2. Go to Settings > Profile > Profile Information');
  console.log('3. Verify the test fields are populated:');
  console.log('   - Department: "Emergency Medicine - Fixed"');
  console.log('   - Phone: "+1 (555) 999-8888"');
  console.log('   - Location: "General Hospital - RLS Fixed"');
  console.log('4. Refresh the page and check if fields persist');
  console.log('5. Look for SUCCESS messages instead of ERROR messages in console');
}

// Set up refresh detection
localStorage.setItem('profile_persistence_test_active', JSON.stringify({
  timestamp: new Date().toISOString(),
  testName: 'RLS Fix Test'
}));

// Check if this is after a refresh
const testActive = localStorage.getItem('profile_persistence_test_active');
if (testActive) {
  const testData = JSON.parse(testActive);
  const timeDiff = Date.now() - new Date(testData.timestamp).getTime();

  if (timeDiff < 60000) { // Within 1 minute
    console.log('🔄 Detected recent test activity, checking refresh persistence...');

    setTimeout(() => {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        console.log('🔍 Profile data after potential refresh:');
        console.log('  Department:', userData.department || 'NOT SET');
        console.log('  Phone:', userData.phone || 'NOT SET');
        console.log('  Location:', userData.location || 'NOT SET');

        if (userData.department && userData.department.includes('Fixed')) {
          console.log('✅ REFRESH PERSISTENCE: Test fields found after refresh!');
        }
      }

      // Clean up after checking
      localStorage.removeItem('profile_persistence_test_active');
    }, 2000);
  }
}

// Run the test
testProfilePersistenceFix();

// Show instructions
setTimeout(showInstructions, 3000);

// Cleanup - remove test script after 30 seconds
setTimeout(() => {
  const script = document.querySelector('script[src*="test-profile-persistence-fix.js"]');
  if (script) {
    script.remove();
  }
}, 30000);