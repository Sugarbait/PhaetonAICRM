/**
 * Test Avatar Cross-Device Synchronization
 *
 * This script tests the enhanced avatar storage system with cross-device sync,
 * using the same robust patterns as the profile data synchronization.
 */

console.log('🖼️ TESTING AVATAR CROSS-DEVICE SYNCHRONIZATION');
console.log('==============================================');

const testAvatarSync = async () => {
  // Check if services are available
  if (!window.avatarStorageService) {
    console.error('❌ avatarStorageService not available. Please wait for app to load fully.');
    return;
  }

  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    console.error('❌ No current user found');
    return;
  }

  try {
    const userData = JSON.parse(currentUser);
    console.log('👤 Current user:', userData.email, 'ID:', userData.id);

    // TEST 1: Check current avatar status
    console.log('\n🔍 TEST 1: Current Avatar Status');
    console.log('================================');

    const currentAvatar = await window.avatarStorageService.getAvatarUrl(userData.id);
    if (currentAvatar) {
      console.log('✅ Current avatar found:', currentAvatar.substring(0, 80) + '...');
      console.log('Avatar type:', currentAvatar.startsWith('data:') ? 'Base64/Local' : 'Cloud URL');
    } else {
      console.log('⚠️ No current avatar found');
    }

    // Check localStorage avatar storage locations
    const avatarData = localStorage.getItem(`avatar_data_${userData.id}`);
    const avatarInfo = localStorage.getItem(`avatar_${userData.id}`);

    console.log('📁 localStorage avatar status:');
    console.log('  - avatar_data:', avatarData ? 'Found (' + avatarData.length + ' chars)' : 'Not found');
    console.log('  - avatar_info:', avatarInfo ? 'Found' : 'Not found');

    if (avatarInfo) {
      try {
        const info = JSON.parse(avatarInfo);
        console.log('  - Avatar info:', {
          synchronized: info.synchronized,
          uploadedAt: info.uploadedAt,
          storagePath: info.storagePath || 'N/A'
        });
      } catch (error) {
        console.log('  - Avatar info parse error:', error.message);
      }
    }

    // TEST 2: Test cross-device sync from cloud
    console.log('\n🌩️ TEST 2: Cross-Device Sync from Cloud');
    console.log('======================================');

    // Backup current avatar data
    const backupAvatarData = localStorage.getItem(`avatar_data_${userData.id}`);
    const backupAvatarInfo = localStorage.getItem(`avatar_${userData.id}`);
    const backupCurrentUser = localStorage.getItem('currentUser');

    console.log('💾 Backing up current avatar data...');

    // Clear local avatar data to simulate fresh device
    localStorage.removeItem(`avatar_data_${userData.id}`);
    localStorage.removeItem(`avatar_${userData.id}`);

    // Also clear avatar from currentUser to fully simulate fresh state
    if (backupCurrentUser) {
      try {
        const userDataClean = JSON.parse(backupCurrentUser);
        delete userDataClean.avatar;
        localStorage.setItem('currentUser', JSON.stringify(userDataClean));
      } catch (error) {
        console.warn('Failed to clean currentUser avatar');
      }
    }

    console.log('🗑️ Cleared local avatar data (simulating fresh device)');

    try {
      // Test enhanced getAvatarUrl with cross-device sync
      console.log('🔄 Testing enhanced getAvatarUrl with cross-device sync...');
      const syncedAvatar = await window.avatarStorageService.getAvatarUrl(userData.id);

      if (syncedAvatar) {
        console.log('✅ CROSS-DEVICE SYNC SUCCESS! Avatar loaded from cloud:');
        console.log('  - Avatar URL:', syncedAvatar.substring(0, 80) + '...');
        console.log('  - Avatar type:', syncedAvatar.startsWith('data:') ? 'Base64/Local' : 'Cloud URL');

        // Check if data was auto-saved to localStorage
        const autoSavedData = localStorage.getItem(`avatar_data_${userData.id}`);
        const autoSavedInfo = localStorage.getItem(`avatar_${userData.id}`);

        if (autoSavedData || autoSavedInfo) {
          console.log('✅ Avatar auto-saved to localStorage for future access');
          console.log('  - Auto-saved data:', autoSavedData ? 'Yes' : 'No');
          console.log('  - Auto-saved info:', autoSavedInfo ? 'Yes' : 'No');
        } else {
          console.log('⚠️ Avatar not auto-saved to localStorage');
        }

      } else {
        console.log('❌ CROSS-DEVICE SYNC FAILED - No avatar loaded from cloud');
        console.log('This means either no avatar exists in cloud or there\'s an issue with cloud loading');
      }

    } finally {
      // Restore backups
      if (backupAvatarData) {
        localStorage.setItem(`avatar_data_${userData.id}`, backupAvatarData);
        console.log('🔄 Restored avatar data backup');
      }
      if (backupAvatarInfo) {
        localStorage.setItem(`avatar_${userData.id}`, backupAvatarInfo);
        console.log('🔄 Restored avatar info backup');
      }
      if (backupCurrentUser) {
        localStorage.setItem('currentUser', backupCurrentUser);
        console.log('🔄 Restored currentUser backup');
      }
    }

    // TEST 3: Test email-based fallback
    console.log('\n📧 TEST 3: Email-Based Avatar Fallback');
    console.log('====================================');

    // Clear everything again for clean test
    localStorage.removeItem(`avatar_data_${userData.id}`);
    localStorage.removeItem(`avatar_${userData.id}`);

    // Simulate different user ID but same email
    const testUserId = 'test-avatar-' + Date.now();
    console.log('🔄 Testing with different user ID:', testUserId);

    const emailFallbackResult = await window.avatarStorageService.getAvatarUrl(testUserId);
    console.log('📧 Email-based fallback result:', emailFallbackResult ? 'SUCCESS' : 'NO AVATAR');

    if (emailFallbackResult) {
      console.log('✅ EMAIL-BASED FALLBACK SUCCESS!');
      console.log('This means avatar will load even with different user IDs on different devices');
    } else {
      console.log('⚠️ Email-based fallback found no avatar - this is normal if no avatar exists');
    }

    // Final restore
    if (backupAvatarData) {
      localStorage.setItem(`avatar_data_${userData.id}`, backupAvatarData);
    }
    if (backupAvatarInfo) {
      localStorage.setItem(`avatar_${userData.id}`, backupAvatarInfo);
    }

    // TEST 4: Test avatar upload and sync
    console.log('\n⬆️ TEST 4: Avatar Upload and Sync Test');
    console.log('====================================');

    // Create a test image (1x1 pixel red square)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);

    const testImageBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });

    console.log('🎨 Created test image (1x1 red pixel)');

    try {
      console.log('⬆️ Uploading test avatar...');
      const uploadResult = await window.avatarStorageService.uploadAvatar(userData.id, testImageBlob);

      if (uploadResult.status === 'success') {
        console.log('✅ AVATAR UPLOAD SUCCESS!');
        console.log('  - New avatar URL:', uploadResult.data.substring(0, 80) + '...');

        // Test loading the new avatar
        const newAvatarCheck = await window.avatarStorageService.getAvatarUrl(userData.id);
        if (newAvatarCheck === uploadResult.data) {
          console.log('✅ Avatar sync verification passed');
        } else {
          console.log('⚠️ Avatar sync verification mismatch');
        }

      } else {
        console.log('❌ Avatar upload failed:', uploadResult.error);
      }

    } catch (uploadError) {
      console.log('❌ Avatar upload test failed:', uploadError.message);
    }

    console.log('\n🎉 AVATAR CROSS-DEVICE SYNC TEST COMPLETED!');

  } catch (error) {
    console.error('❌ Error during avatar sync test:', error);
  }
};

// Test avatar synchronization across devices
const testAvatarCrossDeviceSync = async () => {
  console.log('\n🔄 TESTING AVATAR CROSS-DEVICE SYNCHRONIZATION');
  console.log('==============================================');

  if (!window.avatarStorageService) {
    console.error('❌ avatarStorageService not available');
    return;
  }

  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    console.error('❌ No current user found');
    return;
  }

  const userData = JSON.parse(currentUser);

  try {
    console.log('🔄 Testing syncAvatarAcrossDevices method...');
    const syncResult = await window.avatarStorageService.syncAvatarAcrossDevices(userData.id);

    console.log('📊 Sync result:', syncResult);

    if (syncResult.status === 'success') {
      console.log('✅ Cross-device sync successful');
      console.log('  - Synced avatar:', syncResult.data || 'No avatar');
    } else {
      console.log('❌ Cross-device sync failed:', syncResult.error);
    }

  } catch (error) {
    console.error('❌ Cross-device sync test failed:', error);
  }
};

// Quick avatar status check
const quickAvatarCheck = async () => {
  console.log('\n⚡ QUICK AVATAR STATUS CHECK');
  console.log('===========================');

  if (!window.avatarStorageService) {
    console.error('❌ avatarStorageService not available');
    return;
  }

  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    console.error('❌ No current user found');
    return;
  }

  const userData = JSON.parse(currentUser);
  console.log('👤 User:', userData.email);

  const avatar = await window.avatarStorageService.getAvatarUrl(userData.id);
  if (avatar) {
    console.log('✅ Avatar found:', avatar.length > 100 ? avatar.substring(0, 100) + '...' : avatar);
    console.log('📊 Type:', avatar.startsWith('data:') ? 'Local/Base64' : 'Cloud URL');
  } else {
    console.log('❌ No avatar found');
  }

  // Check localStorage status
  const localData = localStorage.getItem(`avatar_data_${userData.id}`);
  const localInfo = localStorage.getItem(`avatar_${userData.id}`);

  console.log('📁 Local storage:');
  console.log('  - Data:', localData ? 'Present' : 'Missing');
  console.log('  - Info:', localInfo ? 'Present' : 'Missing');
};

// Export functions to window
window.avatarSyncTest = {
  test: testAvatarSync,
  crossDeviceSync: testAvatarCrossDeviceSync,
  quickCheck: quickAvatarCheck
};

console.log('\n🎮 AVATAR SYNC TEST USAGE:');
console.log('1. window.avatarSyncTest.test() - Full avatar sync test');
console.log('2. window.avatarSyncTest.crossDeviceSync() - Test cross-device sync method');
console.log('3. window.avatarSyncTest.quickCheck() - Quick avatar status check');
console.log('');
console.log('🚀 RECOMMENDED: Start with quickCheck(), then run test()');

// Auto-run quick check if services are ready
if (window.avatarStorageService) {
  console.log('\n🚀 Auto-running quick avatar check...');
  quickAvatarCheck();
}