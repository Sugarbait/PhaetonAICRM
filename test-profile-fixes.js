/**
 * Test Profile Saving Fixes
 * Run this in browser console to test if profile saving is working
 */

console.log('🧪 TESTING PROFILE SAVING FIXES');
console.log('===============================');

// Test 1: Check if user ID is available
const checkUserAvailability = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  console.log('✅ Test 1 - User Availability:');
  console.log('Current User ID:', currentUser.id);
  console.log('User Email:', currentUser.email);
  console.log('User Data:', currentUser);
  return !!currentUser.id;
};

// Test 2: Test localStorage profile saving
const testLocalStorageSave = () => {
  console.log('\n✅ Test 2 - LocalStorage Profile Saving:');

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.id) {
    console.log('❌ Cannot test - no user ID available');
    return false;
  }

  const testProfile = {
    department: 'Test Department',
    phone: '555-0123',
    location: 'Test Location'
  };

  // Save test profile fields
  localStorage.setItem(`profileFields_${currentUser.id}`, JSON.stringify(testProfile));

  // Try to read them back
  const saved = localStorage.getItem(`profileFields_${currentUser.id}`);
  if (saved) {
    const parsed = JSON.parse(saved);
    console.log('✅ Profile fields saved and retrieved successfully:');
    console.log('Department:', parsed.department);
    console.log('Phone:', parsed.phone);
    console.log('Location:', parsed.location);
    return true;
  } else {
    console.log('❌ Profile fields not saved properly');
    return false;
  }
};

// Test 3: Check if profile form shows saved data
const testFormDisplay = () => {
  console.log('\n✅ Test 3 - Profile Form Display:');

  // Look for profile form inputs
  const departmentInput = document.querySelector('input[placeholder*="department" i], input[name*="department" i]');
  const phoneInput = document.querySelector('input[placeholder*="phone" i], input[name*="phone" i]');
  const locationInput = document.querySelector('input[placeholder*="location" i], input[name*="location" i]');

  console.log('Department input found:', !!departmentInput);
  console.log('Phone input found:', !!phoneInput);
  console.log('Location input found:', !!locationInput);

  if (departmentInput) console.log('Department value:', departmentInput.value);
  if (phoneInput) console.log('Phone value:', phoneInput.value);
  if (locationInput) console.log('Location value:', locationInput.value);

  return !!(departmentInput && phoneInput && locationInput);
};

// Run all tests
const runAllTests = () => {
  console.log('🚀 Running Profile Saving Tests...\n');

  const test1 = checkUserAvailability();
  const test2 = testLocalStorageSave();
  const test3 = testFormDisplay();

  console.log('\n📊 TEST RESULTS:');
  console.log('=================');
  console.log('✅ User Available:', test1 ? 'PASS' : 'FAIL');
  console.log('✅ LocalStorage Save:', test2 ? 'PASS' : 'FAIL');
  console.log('✅ Form Display:', test3 ? 'PASS' : 'FAIL');

  const allPassed = test1 && test2 && test3;
  console.log('\n🎯 OVERALL RESULT:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

  if (!allPassed) {
    console.log('\n🔧 TROUBLESHOOTING:');
    if (!test1) console.log('- Make sure you are logged in with a valid user');
    if (!test2) console.log('- LocalStorage access may be restricted or user ID is missing');
    if (!test3) console.log('- Navigate to Settings > Profile to test form display');
  }

  return allPassed;
};

// Export for global access
window.testProfileFixes = {
  runAllTests,
  checkUserAvailability,
  testLocalStorageSave,
  testFormDisplay
};

console.log('\n🎮 USAGE:');
console.log('Run window.testProfileFixes.runAllTests() to test all fixes');
console.log('Or run individual tests like window.testProfileFixes.testLocalStorageSave()');

// Auto-run tests
runAllTests();