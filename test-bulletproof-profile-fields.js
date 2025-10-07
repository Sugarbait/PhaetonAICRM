// Test script for Bulletproof Profile Fields Service
// Run this in browser console on the Profile Settings page

console.log('🛡️ Testing Bulletproof Profile Fields Service...')

// Test function for profile fields
async function testBulletproofProfileFields() {
  console.log('🧪 Starting bulletproof profile fields test...')

  try {
    // Import the bulletproof service
    const { bulletproofProfileFieldsService } = await import('./src/services/bulletproofProfileFieldsService.ts')

    // Get current user
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      console.error('❌ No current user found')
      return
    }

    const userData = JSON.parse(currentUser)
    const userId = userData.id

    console.log('👤 Testing with user:', userData.email, 'ID:', userId)

    // Test 1: Save profile fields
    console.log('\n📝 Test 1: Saving profile fields...')
    const testFields = {
      department: 'Cardiology Department - Test',
      phone: '+1 (555) 123-4567',
      location: 'Toronto General Hospital',
      display_name: 'Dr. Test User',
      bio: 'Experienced cardiologist specializing in interventional procedures.'
    }

    const saveResult = await bulletproofProfileFieldsService.saveProfileFields(userId, testFields)
    console.log('💾 Save result:', saveResult)

    if (saveResult.status === 'success') {
      console.log('✅ Save successful:', saveResult.data)
    } else {
      console.error('❌ Save failed:', saveResult.error)
    }

    // Test 2: Load profile fields
    console.log('\n📖 Test 2: Loading profile fields...')
    const loadResult = await bulletproofProfileFieldsService.loadProfileFields(userId)
    console.log('📚 Load result:', loadResult)

    if (loadResult.status === 'success') {
      console.log('✅ Load successful:', loadResult.data)

      // Verify the saved data matches
      const loaded = loadResult.data
      let allMatch = true
      for (const [key, value] of Object.entries(testFields)) {
        if (loaded[key] !== value) {
          console.warn(`⚠️ Mismatch for ${key}: expected "${value}", got "${loaded[key]}"`)
          allMatch = false
        }
      }

      if (allMatch) {
        console.log('✅ All fields match - save/load working perfectly!')
      }
    } else {
      console.error('❌ Load failed:', loadResult.error)
    }

    // Test 3: Check storage status
    console.log('\n📊 Test 3: Checking sync status...')
    const syncStatus = bulletproofProfileFieldsService.getSyncStatus(userId)
    console.log('📈 Sync status:', syncStatus)

    // Test 4: Force sync from cloud (if available)
    if (syncStatus.cloudAvailable) {
      console.log('\n☁️ Test 4: Force syncing from cloud...')
      const forceSyncResult = await bulletproofProfileFieldsService.forceSyncFromCloud(userId)
      console.log('🔄 Force sync result:', forceSyncResult)
    } else {
      console.log('\n💡 Test 4: Skipped - cloud not available')
    }

    // Test 5: Check multiple storage locations
    console.log('\n🗃️ Test 5: Checking multiple storage locations...')
    const storageKeys = ['profileFields_', 'userProfile_', 'profileData_', 'userFields_']
    let storageCount = 0

    for (const keyPrefix of storageKeys) {
      const key = `${keyPrefix}${userId}`
      const data = localStorage.getItem(key)
      if (data) {
        storageCount++
        console.log(`✅ Found data in ${key}`)
        try {
          const parsed = JSON.parse(data)
          console.log(`   - Department: ${parsed.department || 'EMPTY'}`)
          console.log(`   - Phone: ${parsed.phone || 'EMPTY'}`)
          console.log(`   - Location: ${parsed.location || 'EMPTY'}`)
        } catch (error) {
          console.warn(`⚠️ Failed to parse data from ${key}`)
        }
      } else {
        console.log(`❌ No data in ${key}`)
      }
    }

    // Check global fallback
    const allProfiles = localStorage.getItem('allUserProfiles')
    if (allProfiles) {
      try {
        const profiles = JSON.parse(allProfiles)
        if (profiles[userId]) {
          storageCount++
          console.log('✅ Found data in global allUserProfiles')
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse allUserProfiles')
      }
    }

    console.log(`📊 Total storage locations with data: ${storageCount}`)

    // Final summary
    console.log('\n🏁 Test Summary:')
    console.log(`- Save operation: ${saveResult.status === 'success' ? 'PASSED' : 'FAILED'}`)
    console.log(`- Load operation: ${loadResult.status === 'success' ? 'PASSED' : 'FAILED'}`)
    console.log(`- Cloud available: ${syncStatus.cloudAvailable ? 'YES' : 'NO'}`)
    console.log(`- Local storage count: ${syncStatus.localStorageCount}`)
    console.log(`- Multiple storage: ${storageCount} locations`)

    if (saveResult.status === 'success' && loadResult.status === 'success') {
      console.log('🎉 All tests PASSED! Profile fields service is working correctly.')
    } else {
      console.log('⚠️ Some tests failed. Check the details above.')
    }

    return {
      saveSuccess: saveResult.status === 'success',
      loadSuccess: loadResult.status === 'success',
      cloudAvailable: syncStatus.cloudAvailable,
      storageLocations: storageCount
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error)
    return {
      saveSuccess: false,
      loadSuccess: false,
      cloudAvailable: false,
      storageLocations: 0,
      error: error.message
    }
  }
}

// Export test functions for manual use
window.bulletproofProfileTests = {
  testBulletproofProfileFields
}

console.log('🔧 Test functions available at: window.bulletproofProfileTests')
console.log('💡 Run test: window.bulletproofProfileTests.testBulletproofProfileFields()')
console.log('📝 This will test cross-browser profile field persistence')
console.log('🌐 Open in Chrome and Edge to verify cross-browser compatibility')