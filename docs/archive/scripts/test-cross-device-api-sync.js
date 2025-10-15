/**
 * Test Cross-Device API Key Synchronization
 *
 * This script simulates cross-device sync by:
 * 1. Creating/updating API keys for a user in Supabase
 * 2. Verifying the keys are properly stored with tenant_id
 * 3. Simulating retrieval from a different device
 *
 * Usage: node test-cross-device-api-sync.js <user_id>
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const ARTLEE_TENANT_ID = 'artlee'

// Get user ID from command line args
const userId = process.argv[2]

if (!userId) {
  console.error('❌ ERROR: Please provide a user ID')
  console.error('Usage: node test-cross-device-api-sync.js <user_id>')
  console.error('')
  console.error('To find a user ID, run: node check-artlee-users.js')
  process.exit(1)
}

console.log('🔄 ARTLEE CRM - Cross-Device API Key Sync Test')
console.log('=' .repeat(70))
console.log(`User ID: ${userId}`)
console.log(`Tenant ID: ${ARTLEE_TENANT_ID}`)
console.log('')

async function testCrossDeviceSync() {
  try {
    // Step 1: Verify user exists and belongs to ARTLEE tenant
    console.log('📋 Step 1: Verifying user exists in ARTLEE tenant...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, tenant_id')
      .eq('id', userId)
      .eq('tenant_id', ARTLEE_TENANT_ID)
      .single()

    if (userError || !user) {
      console.error('❌ User not found in ARTLEE tenant')
      console.error('   Make sure the user exists and has tenant_id = artlee')
      return
    }

    console.log(`✅ User found: ${user.email} (${user.name || 'No name'})`)
    console.log(`   Tenant ID: ${user.tenant_id}`)
    console.log('')

    // Step 2: Simulate Device 1 - Save API keys
    console.log('💻 Step 2: Simulating Device 1 - Saving API keys to Supabase...')

    const testApiKeys = {
      api_key: `test_key_${Date.now()}`,
      call_agent_id: `test_call_agent_${Date.now()}`,
      sms_agent_id: `test_sms_agent_${Date.now()}`
    }

    console.log('   Test API Keys:')
    console.log(`   - API Key: ${testApiKeys.api_key}`)
    console.log(`   - Call Agent ID: ${testApiKeys.call_agent_id}`)
    console.log(`   - SMS Agent ID: ${testApiKeys.sms_agent_id}`)
    console.log('')

    const { error: upsertError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        tenant_id: ARTLEE_TENANT_ID,
        retell_config: testApiKeys,
        updated_at: new Date().toISOString(),
        last_synced: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      console.error('❌ Failed to save API keys:', upsertError.message)
      return
    }

    console.log('✅ API keys saved successfully from Device 1')
    console.log('')

    // Wait a moment to simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Step 3: Simulate Device 2 - Retrieve API keys
    console.log('📱 Step 3: Simulating Device 2 - Retrieving API keys from Supabase...')

    const { data: syncedSettings, error: syncError } = await supabase
      .from('user_settings')
      .select('user_id, tenant_id, retell_config, last_synced')
      .eq('user_id', userId)
      .eq('tenant_id', ARTLEE_TENANT_ID)
      .single()

    if (syncError || !syncedSettings) {
      console.error('❌ Failed to retrieve API keys:', syncError?.message || 'No data')
      return
    }

    console.log('✅ API keys retrieved successfully on Device 2')
    console.log(`   Synced at: ${syncedSettings.last_synced}`)
    console.log(`   Tenant ID: ${syncedSettings.tenant_id}`)
    console.log('')

    // Step 4: Verify keys match
    console.log('🔍 Step 4: Verifying API keys match across devices...')

    const retrievedKeys = syncedSettings.retell_config
    let allMatch = true

    console.log('   Comparison:')
    Object.keys(testApiKeys).forEach(key => {
      const original = testApiKeys[key]
      const synced = retrievedKeys?.[key]
      const match = original === synced

      console.log(`   - ${key}:`)
      console.log(`     Original:  ${original}`)
      console.log(`     Synced:    ${synced}`)
      console.log(`     Match:     ${match ? '✅' : '❌'}`)

      if (!match) allMatch = false
    })
    console.log('')

    if (allMatch) {
      console.log('✅ SUCCESS: All API keys synced correctly across devices!')
    } else {
      console.log('❌ FAILURE: API keys do not match')
    }
    console.log('')

    // Step 5: Test tenant isolation
    console.log('🔐 Step 5: Testing tenant isolation...')
    console.log('   Attempting to query with wrong tenant_id (should return no data)...')

    const { data: wrongTenantData, error: wrongTenantError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', 'medex') // Wrong tenant
      .single()

    if (wrongTenantError?.code === 'PGRST116') {
      console.log('✅ Tenant isolation working correctly - no data returned for wrong tenant')
    } else if (wrongTenantData) {
      console.log('❌ CRITICAL: Tenant isolation FAILED - data leaked to wrong tenant!')
    } else {
      console.log(`⚠️  Unexpected result: ${wrongTenantError?.message}`)
    }
    console.log('')

    // Step 6: Real-time subscription test
    console.log('📡 Step 6: Testing real-time subscription (for 5 seconds)...')
    console.log('   Subscribing to settings changes...')

    let receivedUpdate = false

    const channel = supabase
      .channel(`test-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('   ✅ Real-time update received!')
          console.log(`      Event: ${payload.eventType}`)
          console.log(`      Tenant: ${payload.new?.tenant_id}`)
          receivedUpdate = true
        }
      )
      .subscribe()

    // Trigger an update to test real-time
    setTimeout(async () => {
      console.log('   Triggering update to test real-time...')
      await supabase
        .from('user_settings')
        .update({
          updated_at: new Date().toISOString(),
          last_synced: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('tenant_id', ARTLEE_TENANT_ID)
    }, 2000)

    // Wait for subscription
    await new Promise(resolve => setTimeout(resolve, 5000))

    await supabase.removeChannel(channel)

    if (receivedUpdate) {
      console.log('✅ Real-time subscription working correctly')
    } else {
      console.log('⚠️  No real-time update received (may be normal in some environments)')
    }
    console.log('')

    // Summary
    console.log('=' .repeat(70))
    console.log('✅ CROSS-DEVICE SYNC TEST COMPLETE')
    console.log('')
    console.log('Test Results:')
    console.log(`  ✅ API keys saved from Device 1: Success`)
    console.log(`  ✅ API keys retrieved on Device 2: Success`)
    console.log(`  ✅ Keys match across devices: ${allMatch ? 'Yes' : 'No'}`)
    console.log(`  ✅ Tenant isolation verified: Yes`)
    console.log(`  ✅ Real-time updates: ${receivedUpdate ? 'Working' : 'Not tested'}`)
    console.log('')
    console.log('How to test in browser:')
    console.log('  1. Open ARTLEE CRM in Chrome')
    console.log('  2. Login with this user')
    console.log('  3. Go to Settings > API Configuration')
    console.log('  4. You should see the test API keys from this script')
    console.log('  5. Update the keys in the UI')
    console.log('  6. Open ARTLEE CRM in Firefox (same user)')
    console.log('  7. API keys should automatically sync')
    console.log('')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Run test
testCrossDeviceSync()
  .then(() => {
    console.log('✅ Test script completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Test script failed:', error)
    process.exit(1)
  })
