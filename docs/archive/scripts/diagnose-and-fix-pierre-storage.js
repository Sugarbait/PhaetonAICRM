/**
 * Diagnose and Fix Pierre's localStorage
 *
 * This script shows EXACTLY what's in localStorage and clears wrong data
 *
 * Copy this entire file and paste into browser console on localhost:3001
 */

console.log('🔍 DIAGNOSING PIERRE\'S LOCALSTORAGE...')
console.log('='.repeat(80))

const userId = '166b5086-5ec5-49f3-9eff-68f75d0c8e79'
const settingsKey = `settings_${userId}`

// Step 1: Show what's in settings
console.log('\n📋 STEP 1: Current Settings')
console.log('-'.repeat(80))

const settingsJson = localStorage.getItem(settingsKey)
if (settingsJson) {
  const settings = JSON.parse(settingsJson)

  console.log('Settings found for Pierre:')
  console.log('  retellApiKey:', settings.retellApiKey || 'NOT SET')
  console.log('  callAgentId:', settings.callAgentId || 'NOT SET')
  console.log('  smsAgentId:', settings.smsAgentId || 'NOT SET')
  console.log('  tenant_id:', settings.tenant_id || 'NOT SET')

  // Check if password is in any field
  const password = '$Ineed1millie$_phaetonai'
  const hasPassword =
    settings.retellApiKey === password ||
    settings.callAgentId === password ||
    settings.smsAgentId === password

  if (hasPassword) {
    console.log('\n⚠️ PASSWORD FOUND IN CREDENTIALS!')
    if (settings.retellApiKey === password) console.log('  → Found in retellApiKey field')
    if (settings.callAgentId === password) console.log('  → Found in callAgentId field')
    if (settings.smsAgentId === password) console.log('  → Found in smsAgentId field')
  }

  // Show all fields
  console.log('\n📄 All fields in settings:')
  Object.keys(settings).forEach(key => {
    const value = settings[key]
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
    const display = valueStr.length > 50 ? valueStr.substring(0, 50) + '...' : valueStr
    console.log(`  ${key}: ${display}`)
  })
} else {
  console.log('❌ No settings found for Pierre')
}

// Step 2: Check ALL localStorage keys
console.log('\n📋 STEP 2: All localStorage Keys')
console.log('-'.repeat(80))

const allKeys = Object.keys(localStorage)
const credentialKeys = allKeys.filter(k =>
  k.startsWith('settings_') ||
  k.startsWith('userCredentials_') ||
  k.startsWith('retell') ||
  k === 'currentUser'
)

console.log('Credential-related keys:')
credentialKeys.forEach(key => {
  console.log(`  - ${key}`)
})

// Step 3: Check for password in ALL keys
console.log('\n🔍 STEP 3: Searching for Password in ALL Keys')
console.log('-'.repeat(80))

const password = '$Ineed1millie$_phaetonai'
let passwordFound = false

allKeys.forEach(key => {
  const value = localStorage.getItem(key)
  if (value && value.includes(password)) {
    passwordFound = true
    console.log(`⚠️ PASSWORD FOUND IN: ${key}`)
    console.log(`   Value: ${value.substring(0, 100)}...`)
  }
})

if (!passwordFound) {
  console.log('✅ Password not found in any localStorage key')
}

// Step 4: FIX IT
console.log('\n🔧 STEP 4: FIXING STORAGE')
console.log('-'.repeat(80))

const confirm = window.confirm(
  'Do you want to:\n' +
  '1. DELETE all credential keys from localStorage\n' +
  '2. This will clear test values AND passwords\n' +
  '3. You will need to re-enter your REAL credentials\n\n' +
  'Continue?'
)

if (confirm) {
  let deletedCount = 0

  // Delete all credential-related keys
  const keysToDelete = Object.keys(localStorage).filter(k =>
    k.startsWith('settings_') ||
    k.startsWith('userCredentials_') ||
    k === 'retell_credentials_backup' ||
    k === '__emergencyRetellCredentials' ||
    k === '__fallbackRetellConfig'
  )

  keysToDelete.forEach(key => {
    localStorage.removeItem(key)
    console.log(`  ✅ Deleted: ${key}`)
    deletedCount++
  })

  // Clear sessionStorage
  sessionStorage.removeItem('retell_credentials_backup')
  console.log('  ✅ Cleared sessionStorage backup')

  // Clear memory backup
  if (window.__retellCredentialsBackup) {
    delete window.__retellCredentialsBackup
    console.log('  ✅ Cleared memory backup')
  }

  console.log('\n✅ CLEANUP COMPLETE!')
  console.log(`   Deleted ${deletedCount} localStorage keys`)
  console.log('')
  console.log('📋 NEXT STEPS:')
  console.log('1. Refresh the page (F5)')
  console.log('2. Go to Settings > API Configuration')
  console.log('3. Enter your REAL credentials:')
  console.log('   - API Key: key_cda2021a151b9a84e721299f2c04')
  console.log('   - Call Agent ID: agent_544379e4fc2a465b7e8eb6fd19')
  console.log('4. Click Save Changes')
  console.log('5. Refresh again to verify')
  console.log('')
} else {
  console.log('❌ Cleanup cancelled')
}

console.log('='.repeat(80))
console.log('🔍 DIAGNOSIS COMPLETE')
console.log('='.repeat(80))
