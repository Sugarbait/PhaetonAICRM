/**
 * Test script for user deletion functionality
 * Run this in the browser console to test the complete user deletion flow
 */

async function testUserDeletion() {
  console.log('🧪 TESTING USER DELETION FLOW');
  console.log('==============================');

  // Get current users
  const storedUsers = localStorage.getItem('systemUsers');
  if (!storedUsers) {
    console.error('❌ No users found in localStorage');
    return;
  }

  const users = JSON.parse(storedUsers);
  console.log(`📊 Found ${users.length} users before deletion`);

  // Find a test user (not the current user)
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const testUser = users.find(u => u.id !== currentUser.id && u.email !== 'elmfarrell@yahoo.com');

  if (!testUser) {
    console.error('❌ No suitable test user found for deletion');
    return;
  }

  console.log(`🎯 Selected test user for deletion: ${testUser.email} (ID: ${testUser.id})`);

  try {
    // Import the user management service
    const { userManagementService } = await import('./src/services/userManagementService.js');

    console.log('⏳ Attempting to delete user...');

    // Delete the user
    const deleteResponse = await userManagementService.deleteSystemUser(testUser.id);

    if (deleteResponse.status === 'success') {
      console.log('✅ User deleted successfully from service');

      // Check localStorage after deletion
      const updatedUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
      const deletedUsersList = JSON.parse(localStorage.getItem('deletedUsers') || '[]');
      const deletedEmailsList = JSON.parse(localStorage.getItem('deletedUserEmails') || '[]');

      console.log(`📊 Users after deletion: ${updatedUsers.length}`);
      console.log(`🗑️ Deleted users tracking: ${deletedUsersList.length} IDs`);
      console.log(`📧 Deleted emails tracking: ${deletedEmailsList.length} emails`);

      // Verify the user is gone
      const userStillExists = updatedUsers.find(u => u.id === testUser.id);
      const userInDeletedList = deletedUsersList.includes(testUser.id);
      const emailInDeletedList = deletedEmailsList.includes(testUser.email.toLowerCase());

      if (!userStillExists && userInDeletedList && emailInDeletedList) {
        console.log('✅ DELETION TEST PASSED: User properly removed and tracked');
      } else {
        console.error('❌ DELETION TEST FAILED:');
        console.error(`  - User still exists: ${!!userStillExists}`);
        console.error(`  - ID in deleted list: ${userInDeletedList}`);
        console.error(`  - Email in deleted list: ${emailInDeletedList}`);
      }

      // Simulate page refresh by reloading users
      console.log('🔄 Testing page refresh simulation...');
      const { userProfileService } = await import('./src/services/userProfileService.js');
      const reloadResponse = await userProfileService.loadSystemUsers();

      if (reloadResponse.status === 'success') {
        const reloadedUsers = reloadResponse.data;
        const userReappeared = reloadedUsers.find(u => u.id === testUser.id);

        if (!userReappeared) {
          console.log('✅ PERSISTENCE TEST PASSED: User did not reappear after reload');
        } else {
          console.error('❌ PERSISTENCE TEST FAILED: User reappeared after reload');
        }
      } else {
        console.error('❌ Failed to reload users for persistence test');
      }

    } else {
      console.error('❌ User deletion failed:', deleteResponse.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }

  console.log('🧪 USER DELETION TEST COMPLETE');
}

// Instructions for running the test
console.log(`
🧪 USER DELETION TEST SCRIPT LOADED
===================================

To run the test, execute:
testUserDeletion()

This will:
1. Find a suitable test user
2. Delete the user via userManagementService
3. Verify localStorage tracking
4. Test persistence after simulated page refresh

Note: Make sure you're on the User Management page for best results.
`);

// Make the function globally available
window.testUserDeletion = testUserDeletion;