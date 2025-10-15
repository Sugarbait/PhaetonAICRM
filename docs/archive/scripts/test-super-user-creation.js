/**
 * Test script to verify super_user role preservation in metadata
 * Run this in the browser console after the app loads
 */

async function testSuperUserCreation() {
  console.log('🧪 Starting Super User Creation Test...')

  const testUserData = {
    email: `test_super_${Date.now()}@carexps.com`,
    name: 'Test Super User',
    role: 'super_user',
    isActive: true,
    settings: {}
  }

  console.log('📝 Test Data:', testUserData)

  // This will trigger all the new logging we just added
  const result = await window.userProfileService.createUser(testUserData)

  console.log('📊 Result:', result)

  if (result.status === 'success') {
    console.log('✅ User created successfully!')
    console.log('🔍 Application Role:', result.data.role)

    // Now fetch the user from Supabase to see what's stored
    const fetchedUser = await window.userProfileService.getUserProfile(result.data.id)
    console.log('📦 Fetched User from DB:', fetchedUser)

    if (fetchedUser.status === 'success') {
      console.log('🔍 Final Comparison:')
      console.log('  - Sent role:', testUserData.role)
      console.log('  - Application role:', result.data.role)
      console.log('  - Fetched role:', fetchedUser.data.role)

      if (fetchedUser.data.role === 'super_user') {
        console.log('✅ SUCCESS: Role preserved correctly as super_user!')
      } else {
        console.log('❌ FAILURE: Role changed to', fetchedUser.data.role)
      }
    }
  } else {
    console.log('❌ User creation failed:', result.error)
  }
}

// Export to window for easy console access
window.testSuperUserCreation = testSuperUserCreation

console.log('✅ Test function loaded! Run: testSuperUserCreation()')
