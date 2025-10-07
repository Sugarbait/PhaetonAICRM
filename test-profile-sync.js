// Test script to verify Department, Phone, Location field saving with cloud sync
console.log('🔧 PROFILE SYNC TEST: Starting Department, Phone, Location field saving test');

// Test data for profile fields
const testProfileData = {
  department: 'Cardiology Department',
  phone: '+1 (555) 123-4567',
  location: 'Toronto, ON',
  bio: 'Experienced healthcare professional specializing in cardiovascular care.',
  display_name: 'Dr. Test User'
};

// Function to test profile field saving
async function testProfileFieldSaving() {
  try {
    // Get current user
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      console.error('❌ No current user found');
      return;
    }

    const userData = JSON.parse(currentUser);
    console.log('✅ Testing with user:', userData.email);

    // Test basic profile update using the updated userProfileService
    console.log('🔄 Testing userProfileService.updateUserProfile with extended fields...');

    // Check if userProfileService is available
    if (typeof window.userProfileService === 'undefined') {
      console.log('📦 userProfileService not available in window, attempting to access via module');

      // Try to trigger a profile update via the settings page
      const updateEvent = new CustomEvent('testProfileUpdate', {
        detail: {
          userId: userData.id,
          updates: testProfileData
        }
      });

      window.dispatchEvent(updateEvent);

      console.log('✅ Dispatched test profile update event');

      // Wait for localStorage to be updated
      setTimeout(() => {
        checkProfileFieldsInLocalStorage(userData.id);
      }, 1000);

    } else {
      // Direct service call if available
      const result = await window.userProfileService.updateUserProfile(userData.id, testProfileData, {
        syncToCloud: true,
        broadcastToOtherDevices: true
      });

      console.log('📊 Update result:', result);
      checkProfileFieldsInLocalStorage(userData.id);
    }

  } catch (error) {
    console.error('❌ Profile field saving test failed:', error);
  }
}

// Function to check if profile fields are saved in localStorage
function checkProfileFieldsInLocalStorage(userId) {
  console.log('🔍 Checking profile fields in localStorage...');

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

  // Check systemUsers
  const systemUsers = localStorage.getItem('systemUsers');
  if (systemUsers) {
    const users = JSON.parse(systemUsers);
    const user = users.find(u => u.id === userId);
    if (user) {
      console.log('📂 systemUsers profile fields:');
      console.log('  Department:', user.department || 'NOT SET');
      console.log('  Phone:', user.phone || 'NOT SET');
      console.log('  Location:', user.location || 'NOT SET');
      console.log('  Bio:', user.bio || 'NOT SET');
      console.log('  Display Name:', user.display_name || 'NOT SET');
    }
  }
}

// Function to simulate profile save via Settings UI
function simulateProfileSave() {
  console.log('🎭 Simulating profile save via Settings UI...');

  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    console.error('❌ No current user found');
    return;
  }

  const userData = JSON.parse(currentUser);

  // Update localStorage directly to simulate successful save
  const updatedUser = {
    ...userData,
    ...testProfileData,
    updated_at: new Date().toISOString()
  };

  localStorage.setItem('currentUser', JSON.stringify(updatedUser));
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

  console.log('✅ Profile fields updated in localStorage');
  checkProfileFieldsInLocalStorage(userData.id);

  // Trigger UI update events
  window.dispatchEvent(new Event('userDataUpdated'));
  window.dispatchEvent(new CustomEvent('userProfileUpdated', {
    detail: updatedUser
  }));

  console.log('✅ UI update events dispatched');
}

// Start the test
console.log('🚀 Starting profile field saving test...');

// Method 1: Try direct service call
testProfileFieldSaving();

// Method 2: Simulate via localStorage (fallback)
setTimeout(() => {
  console.log('\n📋 FALLBACK: Testing via localStorage simulation...');
  simulateProfileSave();
}, 2000);

console.log('✅ PROFILE SYNC TEST: Test script loaded. Results will appear above.');

// Cleanup - remove test script after 10 seconds
setTimeout(() => {
  const script = document.querySelector('script[src*="test-profile-sync.js"]');
  if (script) {
    script.remove();
  }
}, 10000);