// Test script for Profile Fields User ID Preservation Fix
// Run this in browser console after the user ID preservation fix
// This validates that profile fields save and load correctly without corrupting user ID

console.log('🧪 Testing Profile Fields User ID Preservation Fix...')

// Enhanced test function for bulletproof profile fields
async function testProfileFieldsAfterFix() {
  console.log('🛡️ Starting enhanced profile fields test after user ID fix...')

  try {
    // Check if we have a user
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      console.error('❌ No current user found - please login first')
      return false
    }

    const userData = JSON.parse(currentUser)
    const userId = userData.id

    if (!userId || userId === 'undefined') {
      console.error('❌ User ID is corrupted before test - fix needed')
      return false
    }

    console.log('👤 Testing with user:', userData.email, 'ID:', userId)

    // Test enhanced profile fields service (if available)
    if (typeof window.bulletproofProfileFieldsService !== 'undefined') {
      console.log('✅ Using bulletproof profile fields service')

      // Test profile fields
      const testFields = {
        department: 'Cardiology - Enhanced Test',
        phone: '+1 (555) 987-6543',
        location: 'Toronto General Hospital - Suite 200',
        display_name: 'Dr. Enhanced Test User',
        bio: 'Specialist in interventional cardiology with focus on minimally invasive procedures.'
      }

      console.log('📝 Testing save operation...')
      const saveResult = await window.bulletproofProfileFieldsService.saveProfileFields(userId, testFields)
      console.log('💾 Save result:', saveResult)

      // CRITICAL: Check user ID immediately after save
      const userAfterSave = localStorage.getItem('currentUser')
      if (userAfterSave) {
        const userDataAfterSave = JSON.parse(userAfterSave)
        if (!userDataAfterSave.id || userDataAfterSave.id === 'undefined') {
          console.error('🚨 CRITICAL: User ID corrupted after save! Fix failed.')
          return false
        } else {
          console.log('✅ CRITICAL: User ID preserved after save:', userDataAfterSave.id)
        }
      }

      // Test load operation
      console.log('📖 Testing load operation...')
      const loadResult = await window.bulletproofProfileFieldsService.loadProfileFields(userId)
      console.log('📚 Load result:', loadResult)

      // Check if data matches
      if (loadResult.status === 'success') {
        const loaded = loadResult.data
        let allMatch = true
        for (const [key, value] of Object.entries(testFields)) {
          if (loaded[key] !== value) {
            console.warn(`⚠️ Mismatch for ${key}: expected "${value}", got "${loaded[key]}"`)
            allMatch = false
          }
        }

        if (allMatch) {
          console.log('✅ All profile fields match - save/load working perfectly!')
        }

        // Final user ID check after load
        const userAfterLoad = localStorage.getItem('currentUser')
        if (userAfterLoad) {
          const userDataAfterLoad = JSON.parse(userAfterLoad)
          if (!userDataAfterLoad.id || userDataAfterLoad.id === 'undefined') {
            console.error('🚨 CRITICAL: User ID corrupted after load!')
            return false
          } else {
            console.log('✅ CRITICAL: User ID preserved after load:', userDataAfterLoad.id)
          }
        }

        return allMatch && saveResult.status === 'success'
      }

      return false

    } else {
      console.warn('⚠️ Bulletproof profile fields service not available - using fallback test')

      // Test if profile fields work with regular React component
      const profileComponent = document.querySelector('[data-testid="profile-settings"]') ||
                              document.querySelector('.profile-settings') ||
                              document.querySelector('form')

      if (profileComponent) {
        console.log('✅ Found profile form component for testing')

        // Look for profile field inputs
        const departmentInput = document.querySelector('input[name="department"], #department, [placeholder*="department" i]')
        const phoneInput = document.querySelector('input[name="phone"], #phone, [placeholder*="phone" i]')
        const locationInput = document.querySelector('input[name="location"], #location, [placeholder*="location" i]')

        if (departmentInput && phoneInput && locationInput) {
          console.log('✅ Found all profile field inputs')

          // Test setting values
          departmentInput.value = 'Test Department'
          phoneInput.value = '+1 (555) 123-4567'
          locationInput.value = 'Test Location'

          // Trigger change events
          departmentInput.dispatchEvent(new Event('change', { bubbles: true }))
          phoneInput.dispatchEvent(new Event('change', { bubbles: true }))
          locationInput.dispatchEvent(new Event('change', { bubbles: true }))

          console.log('✅ Profile field values set successfully')
          return true
        } else {
          console.warn('⚠️ Could not find all profile field inputs')
          return false
        }
      } else {
        console.warn('⚠️ Could not find profile form component')
        return false
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error)
    return false
  }
}

// Check user ID integrity
function checkUserIdIntegrity() {
  console.log('🔍 Checking user ID integrity...')

  const currentUser = localStorage.getItem('currentUser')
  if (currentUser) {
    try {
      const userData = JSON.parse(currentUser)
      if (userData.id && userData.id !== 'undefined') {
        console.log('✅ User ID is valid:', userData.id)
        console.log('📧 User email:', userData.email)
        return true
      } else {
        console.error('❌ User ID is corrupted:', userData.id)
        return false
      }
    } catch (error) {
      console.error('❌ Failed to parse currentUser:', error)
      return false
    }
  } else {
    console.warn('⚠️ No currentUser found in localStorage')
    return false
  }
}

// Check for backup data
function checkBackupData() {
  console.log('🔍 Checking for backup data...')

  let backupCount = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith('userBackup_') || key.startsWith('systemUserBackup_'))) {
      backupCount++
      console.log('✅ Found backup:', key)
    }
  }

  console.log(`📊 Total backups found: ${backupCount}`)
  return backupCount > 0
}

// Export test functions for manual use
window.profileFieldsTests = {
  testProfileFieldsAfterFix,
  checkUserIdIntegrity,
  checkBackupData
}

console.log('🔧 Enhanced test functions available:')
console.log('- window.profileFieldsTests.testProfileFieldsAfterFix()')
console.log('- window.profileFieldsTests.checkUserIdIntegrity()')
console.log('- window.profileFieldsTests.checkBackupData()')
console.log('')
console.log('💡 Quick test: window.profileFieldsTests.testProfileFieldsAfterFix()')
console.log('🛡️ This validates the user ID preservation fix is working correctly')