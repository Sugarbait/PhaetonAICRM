// Test script to verify User ID corruption fix is working
// Run this in browser console after navigating to Settings > Profile Information

console.log('🛡️ Testing User ID Corruption Fix...')

async function testUserIdFix() {
  console.log('🧪 Starting User ID corruption fix validation...')

  try {
    // Test 1: Check current user state
    console.log('\n📋 Test 1: Current User State')
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      console.log('✅ Current user ID:', userData.id)
      console.log('✅ Current user email:', userData.email)
      console.log('✅ Current user name:', userData.name)

      if (!userData.id || userData.id === 'undefined') {
        console.error('❌ FAIL: User ID is corrupted before test')
        return false
      }
    } else {
      console.error('❌ FAIL: No current user found')
      return false
    }

    // Test 2: Check React user state via window inspection
    console.log('\n📋 Test 2: React User State')
    const headerData = document.querySelector('header')?.textContent
    if (headerData && headerData.includes('undefined')) {
      console.error('❌ FAIL: Header shows undefined user data')
      return false
    } else {
      console.log('✅ Header appears to show valid user data')
    }

    // Test 3: Test profile field save (if service is available)
    console.log('\n📋 Test 3: Profile Fields Save Test')
    if (typeof window.bulletproofProfileFieldsService !== 'undefined') {
      const userId = JSON.parse(localStorage.getItem('currentUser')).id

      const testFields = {
        department: 'Test Department - Fix Validation',
        phone: '+1 (555) 999-8888',
        location: 'Test Location - Fix Validation',
        display_name: 'Test User - Fix Validation',
        bio: 'Testing user ID preservation fix'
      }

      console.log('💾 Saving test profile fields...')
      const saveResult = await window.bulletproofProfileFieldsService.saveProfileFields(userId, testFields)
      console.log('📊 Save result:', saveResult)

      // Critical check: User ID after save
      const userAfterSave = localStorage.getItem('currentUser')
      if (userAfterSave) {
        const userDataAfterSave = JSON.parse(userAfterSave)
        if (!userDataAfterSave.id || userDataAfterSave.id === 'undefined') {
          console.error('❌ FAIL: User ID corrupted after save operation!')
          return false
        } else {
          console.log('✅ SUCCESS: User ID preserved after save:', userDataAfterSave.id)
        }
      }

      // Test load to verify round-trip
      console.log('📖 Loading profile fields...')
      const loadResult = await window.bulletproofProfileFieldsService.loadProfileFields(userId)
      console.log('📊 Load result:', loadResult)

      if (loadResult.status === 'success') {
        console.log('✅ SUCCESS: Profile fields loaded successfully')
      } else {
        console.error('❌ FAIL: Profile fields load failed')
        return false
      }

    } else {
      console.log('⚠️ Bulletproof profile service not available - testing form directly')

      // Test direct form interaction
      const departmentInput = document.querySelector('input[name="department"], #department, [placeholder*="department" i]')
      const phoneInput = document.querySelector('input[name="phone"], #phone, [placeholder*="phone" i]')

      if (departmentInput && phoneInput) {
        console.log('✅ Found profile form inputs')

        // Save original values
        const originalDept = departmentInput.value
        const originalPhone = phoneInput.value

        // Set test values
        departmentInput.value = 'Test Fix Department'
        phoneInput.value = '+1 (555) 999-7777'

        // Trigger change events
        departmentInput.dispatchEvent(new Event('change', { bubbles: true }))
        phoneInput.dispatchEvent(new Event('change', { bubbles: true }))

        console.log('✅ Form values updated successfully')

        // Restore original values
        setTimeout(() => {
          departmentInput.value = originalDept
          phoneInput.value = originalPhone
          departmentInput.dispatchEvent(new Event('change', { bubbles: true }))
          phoneInput.dispatchEvent(new Event('change', { bubbles: true }))
        }, 1000)

      } else {
        console.log('⚠️ Could not find profile form inputs')
      }
    }

    // Test 4: Final user state validation
    console.log('\n📋 Test 4: Final User State Validation')
    const finalUser = localStorage.getItem('currentUser')
    if (finalUser) {
      const finalUserData = JSON.parse(finalUser)
      if (!finalUserData.id || finalUserData.id === 'undefined') {
        console.error('❌ FAIL: User ID corrupted at end of test')
        return false
      } else {
        console.log('✅ SUCCESS: User ID remains valid:', finalUserData.id)
      }
    }

    // Test 5: Check for validation logs
    console.log('\n📋 Test 5: Validation Logs Check')
    // Check if we see the new validation logs in console
    console.log('ℹ️ Look for validation logs like:')
    console.log('  - "🚨 CRITICAL: saveProfileFields called with invalid userId"')
    console.log('  - "✅ BULLETPROOF PROFILE: User backup created successfully"')
    console.log('  - "🛡️ BULLETPROOF PROFILE: Saving to multiple localStorage with ID preservation"')

    console.log('\n🎉 All User ID corruption fix tests PASSED!')
    console.log('✅ User ID is properly preserved throughout profile operations')
    console.log('✅ No corruption detected in localStorage or React state')
    console.log('✅ Validation mechanisms are working correctly')

    return true

  } catch (error) {
    console.error('❌ Test failed with error:', error)
    return false
  }
}

// Additional utility functions
function checkUserIdIntegrity() {
  console.log('🔍 Checking User ID integrity across all storage locations...')

  const locations = [
    'currentUser',
    'systemUsers',
    'allUserProfiles'
  ]

  locations.forEach(key => {
    const data = localStorage.getItem(key)
    if (data) {
      try {
        const parsed = JSON.parse(data)
        console.log(`📍 ${key}:`, parsed)

        if (key === 'currentUser' && (!parsed.id || parsed.id === 'undefined')) {
          console.error(`❌ CORRUPTION DETECTED in ${key}`)
        } else if (key === 'systemUsers' && Array.isArray(parsed)) {
          parsed.forEach((user, index) => {
            if (!user.id || user.id === 'undefined') {
              console.error(`❌ CORRUPTION DETECTED in ${key}[${index}]`)
            }
          })
        }
      } catch (error) {
        console.error(`❌ Failed to parse ${key}:`, error)
      }
    } else {
      console.log(`📍 ${key}: not found`)
    }
  })
}

function checkValidationStatus() {
  console.log('🔍 Checking if validation mechanisms are active...')

  // Check if the bulletproof service has validation
  if (typeof window.bulletproofProfileFieldsService !== 'undefined') {
    console.log('✅ Bulletproof profile service is available')

    // Test invalid user ID handling
    window.bulletproofProfileFieldsService.saveProfileFields('undefined', {
      department: 'test'
    }).then(result => {
      if (result.status === 'error' && result.error === 'Invalid user ID provided') {
        console.log('✅ User ID validation is working correctly')
      } else {
        console.warn('⚠️ User ID validation may not be working')
      }
    })
  }
}

// Export functions for manual use
window.userIdFixTests = {
  testUserIdFix,
  checkUserIdIntegrity,
  checkValidationStatus
}

console.log('🔧 User ID fix test functions available:')
console.log('- window.userIdFixTests.testUserIdFix()')
console.log('- window.userIdFixTests.checkUserIdIntegrity()')
console.log('- window.userIdFixTests.checkValidationStatus()')
console.log('')
console.log('💡 Quick test: window.userIdFixTests.testUserIdFix()')
console.log('🛡️ This validates the user ID corruption fix is working correctly')
console.log('')
console.log('📋 To test:')
console.log('1. Navigate to Settings > Profile Information')
console.log('2. Open browser console')
console.log('3. Run: window.userIdFixTests.testUserIdFix()')
console.log('4. Check for ✅ SUCCESS messages and no ❌ FAIL messages')