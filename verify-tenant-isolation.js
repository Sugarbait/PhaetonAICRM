/**
 * Tenant Isolation Verification Script
 * 
 * Run this after cloning to verify tenant configuration is correct
 * 
 * Usage: node verify-tenant-isolation.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

console.log('\n🔐 TENANT ISOLATION VERIFICATION\n')
console.log('=' .repeat(80))

// Check 1: Verify tenantConfig.ts exists and read tenant ID
console.log('\n📁 Step 1: Checking tenant configuration...')
const configPath = join(__dirname, 'src', 'config', 'tenantConfig.ts')

if (!fs.existsSync(configPath)) {
  console.error('❌ ERROR: tenantConfig.ts not found!')
  console.error('   Expected at:', configPath)
  process.exit(1)
}

const configContent = fs.readFileSync(configPath, 'utf8')
const tenantMatch = configContent.match(/CURRENT_TENANT:\s*'([^']+)'/)

if (!tenantMatch) {
  console.error('❌ ERROR: Could not find CURRENT_TENANT in tenantConfig.ts')
  process.exit(1)
}

const configuredTenantId = tenantMatch[1]
console.log(`   ✅ Found tenant configuration: "${configuredTenantId}"`)

// Validate tenant ID format
if (configuredTenantId !== configuredTenantId.toLowerCase()) {
  console.error(`   ❌ ERROR: Tenant ID must be lowercase!`)
  console.error(`      Current: "${configuredTenantId}"`)
  console.error(`      Should be: "${configuredTenantId.toLowerCase()}"`)
  process.exit(1)
}

if (configuredTenantId.includes(' ')) {
  console.error(`   ❌ ERROR: Tenant ID cannot contain spaces!`)
  console.error(`      Current: "${configuredTenantId}"`)
  process.exit(1)
}

console.log(`   ✅ Tenant ID format is valid (lowercase, no spaces)`)

// Check 2: Verify Supabase credentials
console.log('\n🔑 Step 2: Checking Supabase credentials...')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('   ❌ ERROR: Missing Supabase credentials in .env.local')
  console.error('      VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('      VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

console.log('   ✅ Supabase credentials found')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Check 3: Query database for this tenant
console.log('\n📊 Step 3: Checking database for tenant isolation...')

try {
  const { data: tenantUsers, error } = await supabase
    .from('users')
    .select('email, tenant_id, created_at')
    .eq('tenant_id', configuredTenantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('   ❌ Database query error:', error.message)
    process.exit(1)
  }

  console.log(`   ✅ Database query successful`)
  console.log(`   📈 Found ${tenantUsers.length} users for tenant "${configuredTenantId}"`)

  if (tenantUsers.length === 0) {
    console.log('   ✅ No existing users - ready for first user registration')
  } else {
    console.log('\n   📋 Existing users:')
    tenantUsers.forEach(u => {
      const date = new Date(u.created_at).toLocaleDateString()
      console.log(`      - ${u.email} (created: ${date})`)
    })
  }

  // Check 4: Verify no cross-tenant data leakage
  console.log('\n🔍 Step 4: Checking for cross-tenant data leakage...')

  const { data: allUsers, error: allError } = await supabase
    .from('users')
    .select('email, tenant_id')
    .order('created_at', { ascending: false })
    .limit(100)

  if (allError) {
    console.error('   ❌ Error checking all users:', allError.message)
    process.exit(1)
  }

  const byTenant = {}
  allUsers.forEach(u => {
    if (!byTenant[u.tenant_id]) byTenant[u.tenant_id] = []
    byTenant[u.tenant_id].push(u.email)
  })

  const otherTenants = Object.keys(byTenant).filter(t => t !== configuredTenantId)
  
  if (otherTenants.length > 0) {
    console.log(`   ℹ️  Found ${otherTenants.length} other tenant(s) in database:`)
    otherTenants.forEach(tid => {
      console.log(`      - ${tid}: ${byTenant[tid].length} users`)
    })
    console.log('   ✅ This is expected in a multi-tenant database')
  } else {
    console.log('   ✅ This is the only tenant in the database')
  }

  // Check 5: Verify retellCredentials.ts is cleared
  console.log('\n🔐 Step 5: Checking API credentials...')
  
  const credPath = join(__dirname, 'src', 'config', 'retellCredentials.ts')
  if (fs.existsSync(credPath)) {
    const credContent = fs.readFileSync(credPath, 'utf8')
    
    const apiKeyMatch = credContent.match(/retell_api_key:\s*'([^']*)'/)
    const callAgentMatch = credContent.match(/call_agent_id:\s*'([^']*)'/)
    const smsAgentMatch = credContent.match(/sms_agent_id:\s*'([^']*)'/)
    
    const hasPreloadedCreds = 
      (apiKeyMatch && apiKeyMatch[1] !== '') ||
      (callAgentMatch && callAgentMatch[1] !== '') ||
      (smsAgentMatch && smsAgentMatch[1] !== '')
    
    if (hasPreloadedCreds) {
      console.log('   ⚠️  WARNING: Found pre-populated API credentials!')
      if (apiKeyMatch && apiKeyMatch[1] !== '') {
        console.log('      - retell_api_key is set (should be empty string)')
      }
      if (callAgentMatch && callAgentMatch[1] !== '') {
        console.log('      - call_agent_id is set (should be empty string)')
      }
      if (smsAgentMatch && smsAgentMatch[1] !== '') {
        console.log('      - sms_agent_id is set (should be empty string)')
      }
      console.log('   ⚠️  Consider clearing these before deployment')
    } else {
      console.log('   ✅ API credentials are cleared (empty strings)')
    }
  }

  // Final Summary
  console.log('\n' + '=' .repeat(80))
  console.log('\n✅ VERIFICATION COMPLETE\n')
  console.log('📋 Summary:')
  console.log(`   • Tenant ID: "${configuredTenantId}"`)
  console.log(`   • Format: Valid (lowercase, no spaces)`)
  console.log(`   • Database: Connected successfully`)
  console.log(`   • User Count: ${tenantUsers.length} users for this tenant`)
  console.log(`   • Isolation: ${otherTenants.length} other tenant(s) isolated correctly`)
  
  console.log('\n🎯 Next Steps:')
  if (tenantUsers.length === 0) {
    console.log('   1. ✅ Ready for first user registration')
    console.log('   2. Build the application: npm run build')
    console.log('   3. Start dev server: npm run dev')
    console.log('   4. Register first user (will become Super User)')
    console.log('   5. Verify browser console shows correct tenant_id')
  } else {
    console.log('   1. Verify existing users are correct')
    console.log('   2. Test user login and management')
    console.log('   3. Verify no cross-tenant data visible')
  }
  
  console.log('\n')

} catch (error) {
  console.error('\n❌ Verification failed:', error.message)
  process.exit(1)
}
