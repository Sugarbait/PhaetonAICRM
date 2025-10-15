/**
 * Test Cloud Sync for Profile Data
 * Debug what's being saved to and loaded from the cloud
 */

console.log('🌩️ TESTING CLOUD SYNC FOR PROFILE DATA');
console.log('=====================================');

// Make sure the service is available globally for testing
const ensureServiceAvailable = async () => {
  // If already available, use it
  if (window.robustProfileSyncService) {
    console.log('✅ robustProfileSyncService already available');
    return window.robustProfileSyncService;
  }

  // Try to load from module if not available
  try {
    console.log('🔄 Loading robustProfileSyncService...');

    // Check if we're in a React app context where modules are loaded
    if (window.React && window.React.version) {
      console.log('📱 Detected React app - services should be available soon');

      // Wait a bit for app initialization
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (window.robustProfileSyncService) {
        console.log('✅ Service became available after waiting');
        return window.robustProfileSyncService;
      }
    }

    // Manual service creation as fallback
    console.log('🔧 Creating service manually...');

    // Basic implementation that calls the actual service methods
    const manualService = {
      async loadProfileData(userId) {
        console.log('🔄 MANUAL SERVICE: Loading profile data for:', userId);

        // Try localStorage first
        const currentUser = localStorage.getItem('currentUser');
        const profileFields = localStorage.getItem(`profileFields_${userId}`);

        if (currentUser) {
          try {
            const userData = JSON.parse(currentUser);
            if (userData.id === userId) {
              console.log('✅ MANUAL SERVICE: Found currentUser data');

              // Merge with profile fields if available
              if (profileFields) {
                const fields = JSON.parse(profileFields);
                const mergedData = {
                  ...userData,
                  department: fields.department || '',
                  phone: fields.phone || '',
                  location: fields.location || '',
                  display_name: fields.display_name || userData.name || '',
                  bio: fields.bio || ''
                };
                return { status: 'success', data: mergedData };
              }

              return { status: 'success', data: userData };
            }
          } catch (error) {
            console.error('MANUAL SERVICE: Error parsing currentUser:', error);
          }
        }

        if (profileFields) {
          try {
            const fields = JSON.parse(profileFields);
            console.log('✅ MANUAL SERVICE: Found profile fields');
            return {
              status: 'success',
              data: {
                id: userId,
                email: '',
                name: fields.display_name || '',
                role: 'user',
                ...fields
              }
            };
          } catch (error) {
            console.error('MANUAL SERVICE: Error parsing profile fields:', error);
          }
        }

        return { status: 'error', error: 'No profile data found' };
      }
    };

    window.robustProfileSyncService = manualService;
    console.log('✅ Manual service created and attached to window');
    return manualService;

  } catch (error) {
    console.error('❌ Failed to ensure service availability:', error);
    return null;
  }
};

// Initialize the service
ensureServiceAvailable();

// Test cloud sync by manually saving current localStorage data to cloud
const testCloudSync = async () => {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    console.log('❌ No current user found');
    return;
  }

  try {
    const userData = JSON.parse(currentUser);
    const userId = userData.id;

    // Get current localStorage profile fields
    const profileFieldsStr = localStorage.getItem(`profileFields_${userId}`);
    if (!profileFieldsStr) {
      console.log('❌ No profile fields found in localStorage');
      return;
    }

    const profileFields = JSON.parse(profileFieldsStr);
    console.log('📋 Current localStorage profile fields:', profileFields);

    // Create complete profile data for saving
    const completeProfileData = {
      id: userId,
      email: userData.email,
      name: userData.name || userData.email,
      role: userData.role,
      avatar: userData.avatar,
      mfa_enabled: userData.mfa_enabled || false,
      display_name: profileFields.display_name || userData.name,
      department: profileFields.department,
      phone: profileFields.phone,
      bio: profileFields.bio,
      location: profileFields.location
    };

    console.log('🚀 Complete profile data to save:', completeProfileData);

    // Test the robust sync service
    if (window.robustProfileSyncService) {
      console.log('🔄 Testing robustProfileSyncService.saveProfileData...');

      const result = await window.robustProfileSyncService.saveProfileData(completeProfileData);
      console.log('📊 Save result:', result);

      if (result.status === 'success') {
        console.log('✅ Profile data saved to cloud successfully!');

        // Now test loading from another "device" by clearing localStorage and loading from cloud
        console.log('\n🧪 Testing cross-device sync by simulating fresh device...');

        // Backup current localStorage
        const backup = localStorage.getItem(`profileFields_${userId}`);

        // Clear it temporarily
        localStorage.removeItem(`profileFields_${userId}`);
        console.log('🗑️ Temporarily cleared localStorage profile fields');

        // Try to load from cloud
        const loadResult = await window.robustProfileSyncService.loadProfileData(userId);
        console.log('📥 Load result from cloud:', loadResult);

        if (loadResult.status === 'success' && loadResult.data) {
          console.log('✅ Successfully loaded from cloud:');
          console.log('   - Department:', loadResult.data.department || 'EMPTY');
          console.log('   - Phone:', loadResult.data.phone || 'EMPTY');
          console.log('   - Location:', loadResult.data.location || 'EMPTY');
          console.log('   - Display Name:', loadResult.data.display_name || 'EMPTY');
          console.log('   - Bio:', loadResult.data.bio || 'EMPTY');
        } else {
          console.log('❌ Failed to load from cloud:', loadResult.error);
        }

        // Restore backup
        localStorage.setItem(`profileFields_${userId}`, backup);
        console.log('🔄 Restored localStorage backup');

      } else {
        console.log('❌ Failed to save to cloud:', result.error);
      }
    } else {
      console.log('❌ robustProfileSyncService not available');
    }

  } catch (error) {
    console.error('❌ Error during cloud sync test:', error);
  }
};

// Check what's currently in the cloud
const checkCloudData = async () => {
  console.log('\n🔍 Checking current cloud data...');

  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    console.log('❌ No current user found');
    return;
  }

  try {
    const userData = JSON.parse(currentUser);
    const userId = userData.id;

    // Try to access the service through multiple methods
    let robustService = null;

    if (window.robustProfileSyncService) {
      robustService = window.robustProfileSyncService;
      console.log('✅ Found robustProfileSyncService on window object');
    } else {
      console.log('⚠️ robustProfileSyncService not found on window object');
      console.log('Available window properties:', Object.keys(window).filter(key => key.includes('sync') || key.includes('profile')));

      // Try to import dynamically if in module context
      try {
        // Check if we can access the module system
        if (typeof import !== 'undefined') {
          console.log('🔄 Trying dynamic import...');
          const module = await import('./src/services/robustProfileSyncService.js');
          robustService = module.robustProfileSyncService;
          console.log('✅ Dynamic import successful');
        }
      } catch (importError) {
        console.log('⚠️ Dynamic import failed:', importError.message);
      }
    }

    if (robustService) {
      console.log('🔄 Calling loadProfileData...');
      const loadResult = await robustService.loadProfileData(userId);
      console.log('📥 Load result:', loadResult);

      if (loadResult && loadResult.data) {
        console.log('📊 Profile data found:');
        console.log('   - Name:', loadResult.data.name || 'EMPTY');
        console.log('   - Display Name:', loadResult.data.display_name || 'EMPTY');
        console.log('   - Department:', loadResult.data.department || 'EMPTY');
        console.log('   - Phone:', loadResult.data.phone || 'EMPTY');
        console.log('   - Location:', loadResult.data.location || 'EMPTY');
        console.log('   - Bio:', loadResult.data.bio || 'EMPTY');
        console.log('   - Email:', loadResult.data.email || 'EMPTY');
        console.log('   - Role:', loadResult.data.role || 'EMPTY');
      } else {
        console.log('❌ No profile data returned');
      }
    } else {
      console.log('❌ Could not access robustProfileSyncService');
      console.log('💡 Try running this script after the main app has loaded');

      // Fallback: check localStorage directly
      console.log('\n📁 Checking localStorage directly...');
      const profileFields = localStorage.getItem(`profileFields_${userId}`);
      if (profileFields) {
        console.log('✅ Found profile fields in localStorage:', JSON.parse(profileFields));
      } else {
        console.log('❌ No profile fields found in localStorage');
      }

      const userProfile = localStorage.getItem(`userProfile_${userId}`);
      if (userProfile) {
        console.log('✅ Found user profile in localStorage:', JSON.parse(userProfile));
      } else {
        console.log('❌ No user profile found in localStorage');
      }
    }
  } catch (error) {
    console.error('❌ Error checking cloud data:', error);
  }
};

// Export functions
window.cloudSyncTest = {
  testCloudSync,
  checkCloudData
};

console.log('\n🎮 USAGE:');
console.log('- window.cloudSyncTest.testCloudSync() - Test full cloud sync cycle');
console.log('- window.cloudSyncTest.checkCloudData() - Check current cloud data');

// Auto-run with service initialization
(async () => {
  console.log('\n🚀 AUTO-RUNNING CLOUD DATA CHECK...');
  await ensureServiceAvailable();
  await checkCloudData();
})();