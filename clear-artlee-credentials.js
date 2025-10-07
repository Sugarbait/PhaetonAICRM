/**
 * Cleanup Script: Clear ARTLEE Test Credentials from Supabase
 *
 * This script removes test/placeholder credentials from the user_settings table
 * for the ARTLEE tenant. It sets retell_api_key, call_agent_id, and sms_agent_id
 * to empty strings so the user can enter real credentials.
 *
 * CRITICAL: Only affects records with tenant_id = 'artlee'
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import readline from 'readline'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

async function clearArtleeCredentials() {
  console.log('🔧 ARTLEE Credentials Cleanup Script\n')
  console.log('This script will:')
  console.log('1. Find all user_settings records for tenant_id = "artlee"')
  console.log('2. Clear retell_api_key, call_agent_id, sms_agent_id fields')
  console.log('3. Preserve all other user settings')
  console.log('\n⚠️  WARNING: This action cannot be undone!\n')

  try {
    // Step 1: Query existing settings
    console.log('🔍 Checking for ARTLEE credentials...\n')

    const { data: settings, error: queryError } = await supabase
      .from('user_settings')
      .select('id, user_id, encrypted_api_keys')
      .eq('tenant_id', 'artlee')

    if (queryError) {
      console.error('❌ Error querying user_settings:', queryError)
      rl.close()
      return
    }

    if (!settings || settings.length === 0) {
      console.log('✅ No user_settings records found for ARTLEE tenant')
      rl.close()
      return
    }

    // Show what will be cleared
    console.log(`📊 Found ${settings.length} record(s) to clear:\n`)

    settings.forEach((setting, index) => {
      const apiKeys = setting.encrypted_api_keys || {}
      const apiKey = apiKeys.retellApiKey || apiKeys.retell_api_key || ''
      const callAgentId = apiKeys.callAgentId || apiKeys.call_agent_id || ''
      const smsAgentId = apiKeys.smsAgentId || apiKeys.sms_agent_id || ''

      console.log(`Record ${index + 1}:`)
      console.log(`  User ID: ${setting.user_id}`)
      console.log(`  API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : '(empty)'}`)
      console.log(`  Call Agent ID: ${callAgentId || '(empty)'}`)
      console.log(`  SMS Agent ID: ${smsAgentId || '(empty)'}`)
      console.log('')
    })

    // Ask for confirmation
    const answer = await askQuestion('🔴 Do you want to clear these credentials? (yes/no): ')

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled')
      rl.close()
      return
    }

    // Step 2: Clear credentials for each record
    console.log('\n🧹 Clearing credentials...\n')

    let successCount = 0
    let errorCount = 0

    for (const setting of settings) {
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          encrypted_api_keys: {} // Clear the entire encrypted_api_keys object
        })
        .eq('id', setting.id)
        .eq('tenant_id', 'artlee') // Double-check tenant isolation

      if (updateError) {
        console.error(`❌ Failed to clear record ${setting.id}:`, updateError)
        errorCount++
      } else {
        console.log(`✅ Cleared credentials for user ${setting.user_id}`)
        successCount++
      }
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`✅ Successfully cleared: ${successCount} record(s)`)
    if (errorCount > 0) {
      console.log(`❌ Failed to clear: ${errorCount} record(s)`)
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (successCount > 0) {
      console.log('\n📋 Next Steps:')
      console.log('1. Refresh the ARTLEE CRM application')
      console.log('2. Go to Settings → API Configuration')
      console.log('3. Enter your REAL Retell AI credentials:')
      console.log('   - API Key (starts with "key_" for production)')
      console.log('   - Call Agent ID (starts with "agent_")')
      console.log('   - SMS Agent ID (starts with "agent_")')
      console.log('4. Click Save')
      console.log('\n✅ Your credentials will be saved to Supabase')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  } finally {
    rl.close()
  }
}

// Run the cleanup
clearArtleeCredentials()
