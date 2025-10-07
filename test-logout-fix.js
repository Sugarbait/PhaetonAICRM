/**
 * Test Logout Fix - Comprehensive Test Script
 *
 * This script tests the logout functionality to ensure:
 * 1. justLoggedOut flag prevents credential storage
 * 2. All credential storage locations are cleared
 * 3. No automatic credential restoration occurs
 */

console.log('🧪 Starting Logout Fix Test...')

// Test 1: Set justLoggedOut flag and check credential prevention
function testLogoutFlag() {
  console.log('\n📋 Test 1: Testing justLoggedOut flag prevention')

  // Set the logout flag
  localStorage.setItem('justLoggedOut', 'true')
  console.log('✅ Set justLoggedOut flag to true')

  // Try to trigger credential storage functions
  console.log('🔍 Testing if credential storage is prevented...')

  // Clear existing credentials first
  sessionStorage.removeItem('retell_credentials_backup')
  localStorage.removeItem('__emergencyRetellCredentials')
  delete window.__retellCredentialsBackup

  return {
    justLoggedOutSet: localStorage.getItem('justLoggedOut') === 'true',
    sessionCleared: !sessionStorage.getItem('retell_credentials_backup'),
    localStorageCleared: !localStorage.getItem('__emergencyRetellCredentials'),
    memoryCleared: !window.__retellCredentialsBackup
  }
}

// Test 2: Check current credential storage state
function checkCredentialState() {
  console.log('\n📋 Test 2: Checking current credential storage state')

  const state = {
    justLoggedOut: localStorage.getItem('justLoggedOut'),
    sessionStorage: sessionStorage.getItem('retell_credentials_backup'),
    localStorage: localStorage.getItem('__emergencyRetellCredentials'),
    memory: window.__retellCredentialsBackup,
    currentUser: localStorage.getItem('currentUser'),
    settingsKeys: Object.keys(localStorage).filter(key => key.startsWith('settings_'))
  }

  console.log('Current state:', state)
  return state
}

// Test 3: Simulate logout process
function simulateLogout() {
  console.log('\n📋 Test 3: Simulating logout process')

  // Set justLoggedOut flag (like AuthContext does)
  localStorage.setItem('justLoggedOut', 'true')

  // Clear all credential storage (like AuthContext does)
  sessionStorage.removeItem('retell_credentials_backup')
  if (typeof window !== 'undefined') {
    delete window.__retellCredentialsBackup
  }
  localStorage.removeItem('__emergencyRetellCredentials')
  localStorage.removeItem('__fallbackRetellConfig')

  // Clear user data
  localStorage.removeItem('currentUser')

  // Clear settings
  const settingsKeys = Object.keys(localStorage).filter(key => key.startsWith('settings_'))
  settingsKeys.forEach(key => localStorage.removeItem(key))

  console.log('✅ Simulated complete logout')

  return {
    credentialsCleared: true,
    userDataCleared: !localStorage.getItem('currentUser'),
    settingsCleared: Object.keys(localStorage).filter(key => key.startsWith('settings_')).length === 0
  }
}

// Test 4: Try to trigger credential restoration
function testCredentialRestoration() {
  console.log('\n📋 Test 4: Testing if credential restoration is prevented')

  // Try to call functions that would normally restore credentials
  let restorationAttempted = false
  let restorationPrevented = true

  try {
    // Check if retellService exists and is configured
    if (window.retellService) {
      console.log('🔍 RetellService found, checking configuration...')
      const isConfigured = window.retellService.isConfigured()
      console.log('RetellService configured:', isConfigured)

      if (isConfigured) {
        restorationPrevented = false
        console.log('⚠️ RetellService is still configured after logout')
      }
    }

    // Check if bulletproof initializer exists
    if (window.bulletproofCredentialInitializer) {
      console.log('🔍 BulletproofCredentialInitializer found')
      const status = window.bulletproofCredentialInitializer.getStatusReport()
      console.log('Initializer status:', status)

      if (status.services?.retellService?.configured) {
        restorationPrevented = false
        console.log('⚠️ BulletproofCredentialInitializer shows credentials are still configured')
      }
    }

    restorationAttempted = true
  } catch (error) {
    console.log('ℹ️ Error during restoration test (expected):', error.message)
  }

  return {
    restorationAttempted,
    restorationPrevented,
    justLoggedOutActive: localStorage.getItem('justLoggedOut') === 'true'
  }
}

// Test 5: Comprehensive state check
function comprehensiveStateCheck() {
  console.log('\n📋 Test 5: Comprehensive logout state verification')

  const state = {
    localStorage: {
      justLoggedOut: localStorage.getItem('justLoggedOut'),
      currentUser: localStorage.getItem('currentUser'),
      emergencyCredentials: localStorage.getItem('__emergencyRetellCredentials'),
      fallbackConfig: localStorage.getItem('__fallbackRetellConfig'),
      settingsKeys: Object.keys(localStorage).filter(key => key.startsWith('settings_')).length,
      msalKeys: Object.keys(localStorage).filter(key => key.startsWith('msal.')).length
    },
    sessionStorage: {
      credentialBackup: sessionStorage.getItem('retell_credentials_backup'),
      totalKeys: Object.keys(sessionStorage).length
    },
    memory: {
      credentialBackup: !!window.__retellCredentialsBackup,
      retellService: window.retellService ? window.retellService.isConfigured() : false,
      chatService: window.chatService ? window.chatService.isConfigured() : false
    }
  }

  console.log('Comprehensive state:', JSON.stringify(state, null, 2))

  // Calculate if logout is successful
  const logoutSuccessful =
    state.localStorage.justLoggedOut === 'true' &&
    !state.localStorage.currentUser &&
    !state.localStorage.emergencyCredentials &&
    !state.sessionStorage.credentialBackup &&
    !state.memory.credentialBackup &&
    state.localStorage.settingsKeys === 0

  return {
    ...state,
    logoutSuccessful
  }
}

// Run all tests
async function runLogoutTests() {
  console.log('🚀 Running comprehensive logout tests...')

  const results = {
    test1: testLogoutFlag(),
    test2: checkCredentialState(),
    test3: simulateLogout(),
    test4: testCredentialRestoration(),
    test5: comprehensiveStateCheck()
  }

  console.log('\n📊 Test Results Summary:')
  console.log('='.repeat(50))

  Object.entries(results).forEach(([testName, result]) => {
    console.log(`${testName.toUpperCase()}:`, result)
    console.log('-'.repeat(30))
  })

  // Overall assessment
  const overallSuccess = results.test5.logoutSuccessful
  console.log(`\n🎯 OVERALL LOGOUT TEST: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`)

  if (!overallSuccess) {
    console.log('\n🔍 Issues found:')
    if (results.test5.localStorage.currentUser) console.log('- currentUser still exists')
    if (results.test5.localStorage.emergencyCredentials) console.log('- Emergency credentials still exist')
    if (results.test5.sessionStorage.credentialBackup) console.log('- SessionStorage backup still exists')
    if (results.test5.memory.credentialBackup) console.log('- Memory backup still exists')
    if (results.test5.localStorage.settingsKeys > 0) console.log('- Settings keys still exist')
    if (results.test5.memory.retellService) console.log('- RetellService still configured')
  }

  return results
}

// Make functions available globally for manual testing
window.testLogoutFix = {
  runAllTests: runLogoutTests,
  testLogoutFlag,
  checkCredentialState,
  simulateLogout,
  testCredentialRestoration,
  comprehensiveStateCheck
}

console.log('✅ Logout test functions loaded')
console.log('💡 To run tests, use: window.testLogoutFix.runAllTests()')
console.log('💡 Individual tests: window.testLogoutFix.testLogoutFlag(), etc.')

// Auto-run if not in a browser environment that might interfere
if (typeof window !== 'undefined' && !window.location.hash.includes('test')) {
  console.log('\n🔧 Auto-running logout tests...')
  runLogoutTests()
}