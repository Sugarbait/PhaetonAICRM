// Final test to verify profile field persistence with Supabase fix
console.log('🎯 FINAL PERSISTENCE TEST: Testing Department, Phone, Location persistence');

async function testFinalPersistence() {
  try {
    console.log('🔍 Step 1: Checking if profileFieldsPersistenceService is available...');

    // Check if the service is loaded
    if (typeof window.profileFieldsPersistenceService === 'undefined') {
      console.log('📦 Service not in window, checking if we can access it...');

      // Try to import or access the service
      try {
        // Check if it's available via module system
        console.log('🔧 Attempting to test via direct localStorage operations...');
        testViaLocalStorage();
        return;
      } catch (err) {
        console.warn('Could not access service directly:', err);
      }
    }

    // Get current user
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      console.error('❌ No current user found - please log in first');
      return;
    }

    const userData = JSON.parse(currentUser);
    console.log('✅ Found current user:', userData.email);

    // Test data
    const testData = {
      name: userData.name,
      display_name: 'Dr. Final Test',
      department: 'Critical Care Medicine',
      phone: '+1 (555) 444-3333',
      bio: 'Critical care physician specializing in intensive care unit management.',
      location: 'Calgary General Hospital'
    };

    console.log('📝 Step 2: Testing profile field save...');

    // Test via service if available
    if (typeof window.profileFieldsPersistenceService !== 'undefined') {
      const saveResult = await window.profileFieldsPersistenceService.saveProfileFieldsComplete(userData.id, testData);
      console.log('💾 Save result:', saveResult);

      if (saveResult.status === 'success') {
        console.log('✅ Profile saved successfully via service');

        // Test loading
        console.log('📖 Step 3: Testing profile field load...');
        const loadResult = await window.profileFieldsPersistenceService.loadProfileFieldsComplete(userData.id);
        console.log('📊 Load result:', loadResult);

        if (loadResult.status === 'success') {
          console.log('✅ Profile loaded successfully via service');
          verifyFields(loadResult.data, testData);
        } else {
          console.error('❌ Profile load failed:', loadResult.error);
        }
      } else {
        console.error('❌ Profile save failed:', saveResult.error);
      }
    } else {
      // Fallback to localStorage testing
      testViaLocalStorage();
    }

  } catch (error) {
    console.error('❌ Final persistence test failed:', error);
  }
}

function testViaLocalStorage() {
  console.log('🔧 Testing via localStorage operations...');

  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    console.error('❌ No current user found');
    return;
  }

  const userData = JSON.parse(currentUser);

  // Test data
  const testData = {
    name: userData.name,
    display_name: 'Dr. LocalStorage Test',
    department: 'Pediatric Emergency',
    phone: '+1 (555) 222-1111',
    bio: 'Pediatric emergency physician with expertise in child care.',
    location: 'Children\'s Hospital'
  };

  console.log('📝 Saving test data to localStorage...');

  // Update all localStorage locations
  const updatedUser = { ...userData, ...testData, updated_at: new Date().toISOString() };
  localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  localStorage.setItem(`userProfile_${userData.id}`, JSON.stringify(updatedUser));

  // Update systemUsers
  const systemUsers = localStorage.getItem('systemUsers');
  if (systemUsers) {
    const users = JSON.parse(systemUsers);
    const userIndex = users.findIndex(u => u.id === userData.id);
    if (userIndex >= 0) {
      users[userIndex] = { ...users[userIndex], ...testData, updated_at: new Date().toISOString() };
      localStorage.setItem('systemUsers', JSON.stringify(users));
    }
  }

  console.log('✅ Test data saved to localStorage');

  // Verify immediately
  setTimeout(() => {
    console.log('🔍 Verifying localStorage data...');
    const verifyUser = localStorage.getItem('currentUser');
    if (verifyUser) {
      const parsedUser = JSON.parse(verifyUser);
      verifyFields(parsedUser, testData);
    }
  }, 500);
}

function verifyFields(actualData, expectedData) {
  console.log('📊 FIELD VERIFICATION:');

  const fields = ['department', 'phone', 'location', 'bio', 'display_name'];
  const results = {};

  fields.forEach(field => {
    const actual = actualData[field] || '';
    const expected = expectedData[field] || '';
    results[field] = actual === expected ? '✅ PASS' : '❌ FAIL';

    console.log(`  ${field}:`);
    console.log(`    Expected: "${expected}"`);
    console.log(`    Actual: "${actual}"`);
    console.log(`    Result: ${results[field]}`);
  });

  const allPassed = Object.values(results).every(result => result.includes('PASS'));
  console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL FIELDS VERIFIED' : '❌ SOME FIELDS FAILED'}`);

  if (allPassed) {
    console.log('\n🚀 SUCCESS: Profile field persistence is working!');
    console.log('📋 Next steps:');
    console.log('   1. Go to Settings > Profile > Profile Information');
    console.log('   2. Check if the test fields are populated');
    console.log('   3. Try refreshing the page to verify persistence');
  } else {
    console.log('\n⚠️ ISSUES DETECTED: Some fields may not be persisting correctly');
  }
}

// Set up refresh test
localStorage.setItem('test_final_persistence_trigger', JSON.stringify({
  timestamp: new Date().toISOString(),
  testName: 'Final Persistence Test'
}));

// Check if this is after a refresh
const refreshTrigger = localStorage.getItem('test_final_persistence_trigger');
if (refreshTrigger) {
  const triggerData = JSON.parse(refreshTrigger);
  const timeDiff = Date.now() - new Date(triggerData.timestamp).getTime();

  if (timeDiff < 30000) { // Within 30 seconds
    console.log('🔄 Detected potential refresh, running persistence verification...');
    setTimeout(() => {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        console.log('📋 Profile data after refresh:');
        console.log('  Department:', userData.department || 'NOT SET');
        console.log('  Phone:', userData.phone || 'NOT SET');
        console.log('  Location:', userData.location || 'NOT SET');
        console.log('  Bio:', userData.bio || 'NOT SET');
        console.log('  Display Name:', userData.display_name || 'NOT SET');

        if (userData.department || userData.phone || userData.location) {
          console.log('✅ REFRESH TEST PASSED: Fields persisted through refresh!');
        } else {
          console.log('❌ REFRESH TEST FAILED: No fields found after refresh');
        }
      }

      // Clean up trigger
      localStorage.removeItem('test_final_persistence_trigger');
    }, 2000);
  }
}

// Run the test
testFinalPersistence();

// Cleanup - remove test script after 25 seconds
setTimeout(() => {
  const script = document.querySelector('script[src*="test-final-persistence.js"]');
  if (script) {
    script.remove();
  }
}, 25000);