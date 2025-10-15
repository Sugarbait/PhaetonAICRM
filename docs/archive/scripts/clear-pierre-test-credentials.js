/**
 * Clear Pierre's Test Credentials - Emergency Fix
 *
 * This script clears test credentials from Pierre's user settings
 * User ID: 166b5086-5ec5-49f3-9eff-68f75d0c8e79
 * Email: pierre@phaetonai.com
 *
 * Copy this entire file and paste into browser console on localhost:3001
 */

console.log('🔧 Clearing test credentials for Pierre...')
console.log('User ID: 166b5086-5ec5-49f3-9eff-68f75d0c8e79')

const userId = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
const settingsKey = `settings_${userId}`

// Get current settings
const settingsJson = localStorage.getItem(settingsKey)
if (!settingsJson) {
  console.error('❌ No settings found for user:', userId)
  console.log('Available settings keys:', Object.keys(localStorage).filter(k => k.startsWith('settings_')))
} else {
  console.log('✅ Found settings for user')

  const settings = JSON.parse(settingsJson)

  console.log('Current credentials:')
  console.log('  - API Key:', settings.retellApiKey || 'NOT SET')
  console.log('  - Call Agent:', settings.callAgentId || 'NOT SET')
  console.log('  - SMS Agent:', settings.smsAgentId || 'NOT SET')

  // Check if they are test credentials
  const hasTestApiKey = settings.retellApiKey && settings.retellApiKey.startsWith('test_')
  const hasTestCallAgent = settings.callAgentId && settings.callAgentId.startsWith('test_')
  const hasTestSmsAgent = settings.smsAgentId && settings.smsAgentId.startsWith('test_')

  if (hasTestApiKey || hasTestCallAgent || hasTestSmsAgent) {
    console.log('⚠️ Test credentials detected!')

    // Clear test credentials
    if (hasTestApiKey) {
      delete settings.retellApiKey
      console.log('  ✅ Cleared test API key')
    }
    if (hasTestCallAgent) {
      delete settings.callAgentId
      console.log('  ✅ Cleared test call agent')
    }
    if (hasTestSmsAgent) {
      delete settings.smsAgentId
      console.log('  ✅ Cleared test SMS agent')
    }

    // Save updated settings
    localStorage.setItem(settingsKey, JSON.stringify(settings))

    console.log('')
    console.log('✅ SUCCESS! Test credentials cleared!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Refresh the page (Ctrl+R or F5)')
    console.log('2. Go to Settings > API Configuration')
    console.log('3. Enter your REAL credentials:')
    console.log('   - API Key: key_cda2021a151b9a84e721299f2c04')
    console.log('   - Call Agent ID: agent_544379e4fc2a465b7e8eb6fd19')
    console.log('4. Click Save Changes')
    console.log('')
  } else {
    console.log('✅ No test credentials found - looks good!')
    console.log('Current values appear to be real credentials')
  }
}

console.log('')
console.log('='.repeat(60))
console.log('Script complete!')
console.log('='.repeat(60))
