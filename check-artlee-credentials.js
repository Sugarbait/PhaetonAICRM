/**
 * Diagnostic Script: Check ARTLEE Credentials in Supabase
 *
 * This script queries the user_settings table to show all API credentials
 * stored for the ARTLEE tenant. It will reveal test/placeholder credentials
 * that need to be cleared.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkArtleeCredentials() {
  console.log('🔍 Checking ARTLEE credentials in Supabase...\n')

  try {
    // Query user_settings for ARTLEE tenant
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('id, user_id, encrypted_api_keys, created_at, updated_at')
      .eq('tenant_id', 'artlee')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error querying user_settings:', error)
      return
    }

    if (!settings || settings.length === 0) {
      console.log('✅ No user_settings records found for ARTLEE tenant')
      return
    }

    console.log(`📊 Found ${settings.length} user_settings record(s) for ARTLEE tenant:\n`)

    settings.forEach((setting, index) => {
      console.log(`━━━ Record ${index + 1} ━━━`)
      console.log(`ID: ${setting.id}`)
      console.log(`User ID: ${setting.user_id}`)
      console.log(`Created: ${setting.created_at}`)
      console.log(`Updated: ${setting.updated_at}`)
      console.log(`\nAPI Credentials (from encrypted_api_keys):`)

      const apiKeys = setting.encrypted_api_keys || {}

      // Check Retell API Key
      const apiKey = apiKeys.retellApiKey || apiKeys.retell_api_key || ''
      if (apiKey) {
        const isTestKey = apiKey.startsWith('test_key')
        console.log(`  Retell API Key: ${apiKey.substring(0, 15)}... (length: ${apiKey.length})`)
        console.log(`  ${isTestKey ? '⚠️  TEST KEY DETECTED' : '✅ Appears to be real key'}`)
      } else {
        console.log(`  Retell API Key: (empty)`)
      }

      // Check Call Agent ID
      const callAgentId = apiKeys.callAgentId || apiKeys.call_agent_id || ''
      if (callAgentId) {
        const isTestAgent = callAgentId.includes('test_') || /\d{13}/.test(callAgentId)
        console.log(`  Call Agent ID: ${callAgentId}`)
        console.log(`  ${isTestAgent ? '⚠️  TEST AGENT ID DETECTED' : '✅ Appears to be real agent ID'}`)
      } else {
        console.log(`  Call Agent ID: (empty)`)
      }

      // Check SMS Agent ID
      const smsAgentId = apiKeys.smsAgentId || apiKeys.sms_agent_id || ''
      if (smsAgentId) {
        const isTestAgent = smsAgentId.includes('test_') || /\d{13}/.test(smsAgentId)
        console.log(`  SMS Agent ID: ${smsAgentId}`)
        console.log(`  ${isTestAgent ? '⚠️  TEST AGENT ID DETECTED' : '✅ Appears to be real agent ID'}`)
      } else {
        console.log(`  SMS Agent ID: (empty)`)
      }

      console.log('\n')
    })

    // Summary
    const hasTestData = settings.some(s => {
      const keys = s.encrypted_api_keys || {}
      const apiKey = keys.retellApiKey || keys.retell_api_key || ''
      const callAgent = keys.callAgentId || keys.call_agent_id || ''
      const smsAgent = keys.smsAgentId || keys.sms_agent_id || ''

      return (apiKey && apiKey.startsWith('test_key')) ||
        (callAgent && (callAgent.includes('test_') || /\d{13}/.test(callAgent))) ||
        (smsAgent && (smsAgent.includes('test_') || /\d{13}/.test(smsAgent)))
    })

    if (hasTestData) {
      console.log('🔴 SUMMARY: Test credentials detected!')
      console.log('📋 Run clear-artlee-credentials.js to remove test data')
    } else {
      console.log('✅ SUMMARY: No obvious test credentials detected')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the diagnostic
checkArtleeCredentials()
