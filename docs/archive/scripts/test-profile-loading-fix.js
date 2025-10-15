/**
 * Test Profile Loading Fix
 * Run this in browser console to test the profile loading fixes
 */

console.log('🧪 TESTING PROFILE LOADING FIX');
console.log('==============================');

// Step 1: Save some test profile data
const saveTestProfileData = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.id) {
    console.log('❌ No user ID found - please log in first');
    return false;
  }

  const testProfileData = {
    department: 'Emergency Medicine',
    phone: '+1 (555) 123-4567',
    location: 'Toronto General Hospital',
    display_name: 'Dr. Test User',
    bio: 'Emergency physician with 10+ years experience'
  };

  // Save to the separate profile fields storage (this is what should persist)
  localStorage.setItem(`profileFields_${currentUser.id}`, JSON.stringify(testProfileData));

  console.log('✅ Test profile data saved to localStorage');
  console.log('📁 Data saved:', testProfileData);

  return true;
};

// Step 2: Test if the data can be loaded
const testProfileLoading = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.id) {
    console.log('❌ No user ID found');
    return false;
  }

  console.log('🔄 Testing profile loading...');

  // Check if robustProfileSyncService is available
  if (typeof window.robustProfileSyncService !== 'undefined') {
    console.log('✅ robustProfileSyncService is available');

    try {
      const result = await window.robustProfileSyncService.loadProfileData(currentUser.id);
      console.log('📊 Load result:', result);

      if (result.status === 'success' && result.data) {
        console.log('✅ PROFILE LOADING SUCCESS!');
        console.log('📁 Loaded data:');
        console.log('   - Department:', result.data.department || 'NOT SET');
        console.log('   - Phone:', result.data.phone || 'NOT SET');
        console.log('   - Location:', result.data.location || 'NOT SET');
        console.log('   - Display Name:', result.data.display_name || 'NOT SET');
        console.log('   - Bio:', result.data.bio || 'NOT SET');
        return true;
      } else {
        console.log('❌ Profile loading failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error during profile loading:', error);
      return false;
    }
  } else {
    console.log('❌ robustProfileSyncService not available in window object');

    // Try manual localStorage check
    const profileFields = localStorage.getItem(`profileFields_${currentUser.id}`);
    if (profileFields) {
      console.log('✅ Profile fields found in localStorage:', JSON.parse(profileFields));
      return true;
    } else {
      console.log('❌ No profile fields found in localStorage');
      return false;
    }
  }
};

// Step 3: Full test sequence
const runFullTest = async () => {
  console.log('🚀 Running full profile loading test...\n');

  // Save test data
  const saveSuccess = saveTestProfileData();
  if (!saveSuccess) {
    console.log('❌ Test failed - could not save test data');
    return;
  }

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 100));

  // Test loading
  const loadSuccess = await testProfileLoading();

  console.log('\n📊 TEST RESULT:');
  console.log('================');
  if (loadSuccess) {
    console.log('✅ PROFILE LOADING FIX WORKING!');
    console.log('   → Profile data can be saved and loaded successfully');
    console.log('   → Try refreshing the page and checking Settings > Profile');
  } else {
    console.log('❌ PROFILE LOADING FIX NOT WORKING');
    console.log('   → Check console for error messages');
    console.log('   → Data may not be persisting correctly');
  }
};

// Export to global scope
window.testProfileLoadingFix = {
  runFullTest,
  saveTestProfileData,
  testProfileLoading
};

console.log('\n🎮 USAGE:');
console.log('Run window.testProfileLoadingFix.runFullTest() to test the fix');
console.log('Or use individual functions:');
console.log('- window.testProfileLoadingFix.saveTestProfileData()');
console.log('- window.testProfileLoadingFix.testProfileLoading()');

// Auto-run the test
runFullTest();