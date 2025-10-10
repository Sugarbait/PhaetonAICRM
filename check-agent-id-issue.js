/**
 * Diagnostic script to investigate the Agent ID issue
 *
 * This script will:
 * 1. Check what's stored in Supabase system_credentials table for tenant_id='phaeton_ai'
 * 2. Identify which Agent ID is being loaded
 * 3. Provide instructions to fix the issue
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function investigateAgentIdIssue() {
  console.log('\n🔍 INVESTIGATING AGENT ID ISSUE FOR PHAETON AI CRM\n')
  console.log('=' .repeat(80))

  // Step 1: Check all credentials in system_credentials table
  console.log('\n📋 STEP 1: Checking all system_credentials records...')
  const { data: allCreds, error: allError } = await supabase
    .from('system_credentials')
    .select('*')
    .order('created_at', { ascending: false })

  if (allError) {
    console.error('❌ Error fetching credentials:', allError)
    return
  }

  console.log(`Found ${allCreds?.length || 0} total credential records`)

  // Group by tenant
  const byTenant = {}
  allCreds?.forEach(cred => {
    const tenant = cred.tenant_id || 'unknown'
    if (!byTenant[tenant]) {
      byTenant[tenant] = []
    }
    byTenant[tenant].push(cred)
  })

  console.log('\nCredentials by tenant:')
  Object.entries(byTenant).forEach(([tenant, creds]) => {
    console.log(`  ${tenant}: ${creds.length} records`)
  })

  // Step 2: Focus on Phaeton AI tenant
  console.log('\n📋 STEP 2: Checking Phaeton AI (tenant_id=phaeton_ai) credentials...')
  const { data: phaetonCreds, error: phaetonError } = await supabase
    .from('system_credentials')
    .select('*')
    .eq('tenant_id', 'phaeton_ai')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (phaetonError) {
    console.error('❌ Error fetching Phaeton AI credentials:', phaetonError)
    return
  }

  if (!phaetonCreds || phaetonCreds.length === 0) {
    console.log('⚠️  NO CREDENTIALS FOUND for tenant_id=phaeton_ai')
    console.log('\nThis means Phaeton AI CRM has no API credentials configured yet.')
    console.log('Users need to configure credentials via Settings > API Configuration')
    return
  }

  console.log(`\nFound ${phaetonCreds.length} active credential record(s) for Phaeton AI:`)
  phaetonCreds.forEach((cred, index) => {
    console.log(`\n  Record ${index + 1}:`)
    console.log(`    Type: ${cred.credential_type}`)
    console.log(`    API Key: ${cred.api_key ? cred.api_key.substring(0, 15) + '...' : 'EMPTY'}`)
    console.log(`    Call Agent ID: ${cred.call_agent_id || 'EMPTY'}`)
    console.log(`    SMS Agent ID: ${cred.sms_agent_id || 'EMPTY'}`)
    console.log(`    Created: ${cred.created_at}`)
    console.log(`    Updated: ${cred.updated_at}`)
    console.log(`    User ID: ${cred.user_id || 'system'}`)
    console.log(`    Metadata: ${JSON.stringify(cred.metadata, null, 2)}`)
  })

  // Step 3: Check if any wrong credentials exist (ARTLEE, etc.)
  console.log('\n📋 STEP 3: Checking for potential cross-contamination...')
  const wrongAgentIds = []

  phaetonCreds.forEach(cred => {
    // Check if SMS Agent ID matches ARTLEE pattern (if we know it)
    if (cred.sms_agent_id && cred.sms_agent_id.includes('ARTLEE')) {
      wrongAgentIds.push({
        record: cred,
        issue: 'SMS Agent ID contains ARTLEE reference'
      })
    }
  })

  if (wrongAgentIds.length > 0) {
    console.log(`\n⚠️  FOUND ${wrongAgentIds.length} POTENTIAL ISSUES:`)
    wrongAgentIds.forEach((issue, index) => {
      console.log(`\n  Issue ${index + 1}: ${issue.issue}`)
      console.log(`    SMS Agent ID: ${issue.record.sms_agent_id}`)
      console.log(`    Record ID: ${issue.record.id}`)
    })
  }

  // Step 4: Check other tenants for comparison
  console.log('\n📋 STEP 4: Checking other tenant credentials for comparison...')
  const otherTenants = ['carexps', 'medex', 'artlee']

  for (const tenant of otherTenants) {
    const { data: tenantCreds } = await supabase
      .from('system_credentials')
      .select('sms_agent_id')
      .eq('tenant_id', tenant)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (tenantCreds?.sms_agent_id) {
      console.log(`\n  ${tenant}:`)
      console.log(`    SMS Agent ID: ${tenantCreds.sms_agent_id}`)
    }
  }

  // Step 5: Provide recommendations
  console.log('\n' + '='.repeat(80))
  console.log('\n✅ RECOMMENDATIONS:')
  console.log('\n1. If Phaeton AI has NO credentials yet:')
  console.log('   - Users must configure via Settings > API Configuration')
  console.log('   - This is expected behavior - no action needed')

  console.log('\n2. If Phaeton AI has WRONG credentials (from ARTLEE/other tenants):')
  console.log('   - The credentials may have been copied from another tenant')
  console.log('   - You need to delete the wrong records and insert correct ones')
  console.log('   - Run: DELETE FROM system_credentials WHERE tenant_id=\'phaeton_ai\' AND is_active=true')
  console.log('   - Then configure correct credentials via Settings UI')

  console.log('\n3. If credentials look correct but SMS page shows wrong data:')
  console.log('   - Check localStorage in browser (Settings > API Configuration)')
  console.log('   - Clear browser cache and localStorage')
  console.log('   - Re-login and verify credentials again')

  console.log('\n4. Check the actual SMS Agent ID being used:')
  console.log('   - Open browser console on SMS page')
  console.log('   - Look for: "Fresh RetellService - Filtered chats for agent..."')
  console.log('   - Verify the Agent ID matches Phaeton AI\'s correct agent')

  console.log('\n' + '='.repeat(80) + '\n')
}

// Run the diagnostic
investigateAgentIdIssue().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
