// Quick test script for User Management functionality
// Run this in browser console on the User Management page

console.log('🧪 Testing User Management Implementation...')

// Test 1: Create a test user
async function testCreateUser() {
  console.log('📝 Test 1: Creating a new user...')

  const testUserData = {
    email: `test.user.${Date.now()}@carexps.com`,
    name: 'Test User',
    role: 'super_user',
    mfa_enabled: false,
    settings: {
      theme: 'light',
      notifications: {
        email: true,
        sms: true
      }
    }
  }

  try {
    // Import the userProfileService
    const { userProfileService } = await import('./src/services/userProfileService.ts')

    console.log('Creating user with data:', testUserData)
    const result = await userProfileService.createUser(testUserData)

    if (result.status === 'success') {
      console.log('✅ User created successfully:', result.data)
      return result.data
    } else {
      console.error('❌ User creation failed:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ Error during user creation:', error)
    return null
  }
}

// Test 2: Load all system users
async function testLoadUsers() {
  console.log('📋 Test 2: Loading all system users...')

  try {
    const { userProfileService } = await import('./src/services/userProfileService.ts')

    const result = await userProfileService.loadSystemUsers()

    if (result.status === 'success') {
      console.log('✅ Users loaded successfully:', result.data.length, 'users found')
      console.log('User list:', result.data.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })))
      return result.data
    } else {
      console.error('❌ Failed to load users:', result.error)
      return []
    }
  } catch (error) {
    console.error('❌ Error loading users:', error)
    return []
  }
}

// Test 3: Check localStorage persistence
function testLocalStoragePersistence() {
  console.log('💾 Test 3: Checking localStorage persistence...')

  const systemUsers = localStorage.getItem('systemUsers')
  if (systemUsers) {
    const users = JSON.parse(systemUsers)
    console.log('✅ Found', users.length, 'users in localStorage')
    console.log('Users in localStorage:', users.map(u => ({ email: u.email, name: u.name, role: u.role })))
    return true
  } else {
    console.log('❌ No users found in localStorage')
    return false
  }
}

// Test 4: Check real-time event listeners
function testEventListeners() {
  console.log('📡 Test 4: Testing real-time event system...')

  // Trigger a test event
  const testEvent = new CustomEvent('userCreated', {
    detail: {
      id: 'test-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'staff'
    }
  })

  window.dispatchEvent(testEvent)
  console.log('✅ Test event dispatched')

  const testUpdateEvent = new CustomEvent('userDataUpdated', {
    detail: {
      action: 'user_added',
      user: {
        id: 'test-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'staff'
      }
    }
  })

  window.dispatchEvent(testUpdateEvent)
  console.log('✅ Test update event dispatched')
}

// Test 5: Check what's in Supabase directly
async function testSupabaseUsers() {
  console.log('🗄️ Test 5: Checking Supabase users table directly...')

  try {
    // Import supabase client
    const { supabase } = await import('./src/config/supabase.ts')

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Supabase query error:', error)
      return []
    }

    console.log('✅ Direct Supabase query successful:', data.length, 'users found')
    console.log('Supabase users:', data.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      created_at: u.created_at
    })))
    return data
  } catch (error) {
    console.error('❌ Error querying Supabase:', error)
    return []
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting User Management Tests...')

  // Test localStorage first
  const localStorageWorking = testLocalStoragePersistence()

  // Test user loading
  const users = await testLoadUsers()

  // Test Supabase directly
  const supabaseUsers = await testSupabaseUsers()

  // Test user creation
  const newUser = await testCreateUser()

  // Test event system
  testEventListeners()

  // Final check
  console.log('🏁 Test Results Summary:')
  console.log('- localStorage working:', localStorageWorking)
  console.log('- Users loaded via service:', users.length)
  console.log('- Users in Supabase directly:', supabaseUsers.length)
  console.log('- New user created:', !!newUser)
  console.log('- Event system tested: true')

  if (localStorageWorking && users.length > 0) {
    console.log('✅ User Management system appears to be working.')
  } else {
    console.log('⚠️  Some tests failed. Check the details above.')
  }

  return {
    localStorageWorking,
    usersLoaded: users.length,
    supabaseUsers: supabaseUsers.length,
    newUserCreated: !!newUser,
    eventSystemTested: true
  }
}

// Export test functions for manual use
window.userManagementTests = {
  testCreateUser,
  testLoadUsers,
  testLocalStoragePersistence,
  testEventListeners,
  testSupabaseUsers,
  runAllTests
}

console.log('🔧 Test functions available at: window.userManagementTests')
console.log('💡 Run all tests: window.userManagementTests.runAllTests()')
console.log('💡 Check Supabase directly: window.userManagementTests.testSupabaseUsers()')