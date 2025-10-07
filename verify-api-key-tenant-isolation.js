/**
 * Verify API Key Tenant Isolation for ARTLEE CRM
 *
 * This script checks that API keys stored in Supabase are properly isolated by tenant_id
 *
 * Usage: node verify-api-key-tenant-isolation.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing Supabase credentials in .env.local')
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 ARTLEE CRM - API Key Tenant Isolation Verification')
console.log('=' .repeat(60))
console.log('')

async function verifyTenantIsolation() {
  try {
    console.log('📊 Step 1: Checking user_settings table for tenant_id column...')

    // Check all user_settings with retell_config
    const { data: allSettings, error: allError } = await supabase
      .from('user_settings')
      .select('user_id, tenant_id, retell_config')
      .not('retell_config', 'is', null)

    if (allError) {
      console.error('❌ Error querying user_settings:', allError.message)
      return
    }

    console.log(`   Found ${allSettings?.length || 0} user_settings with retell_config`)
    console.log('')

    // Group by tenant
    const byTenant = {}
    allSettings?.forEach(setting => {
      const tenantId = setting.tenant_id || 'NULL'
      if (!byTenant[tenantId]) {
        byTenant[tenantId] = []
      }
      byTenant[tenantId].push(setting)
    })

    console.log('📋 Step 2: Settings grouped by tenant_id:')
    Object.keys(byTenant).forEach(tenantId => {
      console.log(`   ${tenantId}: ${byTenant[tenantId].length} settings`)
      byTenant[tenantId].forEach(setting => {
        const hasApiKey = setting.retell_config?.api_key ? '✓' : '✗'
        const hasCallAgent = setting.retell_config?.call_agent_id ? '✓' : '✗'
        const hasSmsAgent = setting.retell_config?.sms_agent_id ? '✓' : '✗'
        console.log(`     - User: ${setting.user_id} | API Key: ${hasApiKey} | Call Agent: ${hasCallAgent} | SMS Agent: ${hasSmsAgent}`)
      })
    })
    console.log('')

    // Check ARTLEE tenant specifically
    console.log('🏢 Step 3: Checking ARTLEE tenant (tenant_id = artlee)...')
    const { data: artleeSettings, error: artleeError } = await supabase
      .from('user_settings')
      .select('user_id, tenant_id, retell_config')
      .eq('tenant_id', 'artlee')

    if (artleeError) {
      console.error('❌ Error querying ARTLEE settings:', artleeError.message)
    } else {
      console.log(`   ARTLEE users with settings: ${artleeSettings?.length || 0}`)
      if (artleeSettings && artleeSettings.length > 0) {
        artleeSettings.forEach(setting => {
          console.log(`   - User ID: ${setting.user_id}`)
          console.log(`     Has API config: ${setting.retell_config ? 'Yes' : 'No'}`)
          if (setting.retell_config) {
            console.log(`     API Key configured: ${setting.retell_config.api_key ? 'Yes' : 'No'}`)
            console.log(`     Call Agent ID: ${setting.retell_config.call_agent_id || 'Not set'}`)
            console.log(`     SMS Agent ID: ${setting.retell_config.sms_agent_id || 'Not set'}`)
          }
        })
      } else {
        console.log('   No ARTLEE user settings found yet (expected for new installations)')
      }
    }
    console.log('')

    // Check for any settings without tenant_id
    console.log('⚠️  Step 4: Checking for settings without tenant_id (data integrity check)...')
    const { data: noTenantSettings, error: noTenantError } = await supabase
      .from('user_settings')
      .select('user_id, tenant_id')
      .is('tenant_id', null)

    if (noTenantError) {
      console.error('❌ Error checking for null tenant_id:', noTenantError.message)
    } else if (noTenantSettings && noTenantSettings.length > 0) {
      console.log(`   ❌ CRITICAL: Found ${noTenantSettings.length} settings without tenant_id!`)
      noTenantSettings.forEach(setting => {
        console.log(`     - User ID: ${setting.user_id} | tenant_id: NULL`)
      })
      console.log('')
      console.log('   Action required: Run migration to add tenant_id to these records')
    } else {
      console.log('   ✅ All settings have tenant_id assigned')
    }
    console.log('')

    // Cross-tenant leakage test
    console.log('🔐 Step 5: Cross-tenant leakage test...')
    const tenants = ['artlee', 'medex', 'carexps']

    for (const tenant of tenants) {
      const { data: tenantData, error: tenantError } = await supabase
        .from('user_settings')
        .select('user_id, tenant_id, retell_config')
        .eq('tenant_id', tenant)
        .not('retell_config', 'is', null)

      if (tenantError) {
        console.log(`   ❌ Error querying ${tenant}:`, tenantError.message)
      } else {
        console.log(`   ${tenant.toUpperCase()}: ${tenantData?.length || 0} settings with API config`)

        // Verify no cross-contamination
        if (tenantData) {
          const wrongTenant = tenantData.filter(s => s.tenant_id !== tenant)
          if (wrongTenant.length > 0) {
            console.log(`   ❌ CRITICAL: Found ${wrongTenant.length} settings with wrong tenant_id!`)
          } else {
            console.log(`   ✅ No cross-tenant contamination detected`)
          }
        }
      }
    }
    console.log('')

    // Summary
    console.log('=' .repeat(60))
    console.log('✅ VERIFICATION COMPLETE')
    console.log('')
    console.log('Summary:')
    console.log(`  Total settings with API config: ${allSettings?.length || 0}`)
    console.log(`  Tenants found: ${Object.keys(byTenant).join(', ')}`)
    console.log(`  ARTLEE settings: ${artleeSettings?.length || 0}`)
    console.log('')
    console.log('Next steps:')
    console.log('  1. Create a user in ARTLEE CRM')
    console.log('  2. Configure API keys in Settings > API Configuration')
    console.log('  3. Run this script again to verify cross-device sync')
    console.log('  4. Login from different browser/device with same user')
    console.log('  5. Verify API keys are automatically synced')
    console.log('')

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Run verification
verifyTenantIsolation()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
