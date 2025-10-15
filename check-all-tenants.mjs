import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

async function checkAllTenants() {
  console.log('=== CHECKING ALL TENANTS ===\n')

  // Query ALL users regardless of tenant
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Database Error:', error)
    return
  }

  console.log(`Found ${users.length} total users in database:\n`)

  // Group by tenant
  const tenantGroups = {}
  users.forEach(user => {
    const tenant = user.tenant_id || 'null'
    if (!tenantGroups[tenant]) {
      tenantGroups[tenant] = []
    }
    tenantGroups[tenant].push(user)
  })

  console.log('Users grouped by tenant:')
  Object.keys(tenantGroups).forEach(tenant => {
    console.log(`\n[Tenant: ${tenant}] - ${tenantGroups[tenant].length} users`)
    tenantGroups[tenant].forEach(user => {
      console.log(`  - ${user.email}`)
      console.log(`    Role: ${user.role}`)
      console.log(`    Metadata:`, user.metadata)
      console.log(`    Is Active: ${user.is_active}`)
      console.log(`    Created: ${user.created_at}`)
    })
  })

  // Check what tenant_id is expected
  console.log('\n=== EXPECTED TENANT ID ===')
  console.log('According to tenantConfig.ts, the current tenant should be:')
  console.log('  - Check VITE_APP_TENANT environment variable')
  console.log('  - Or default to "phaeton_ai"')
}

checkAllTenants()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script Error:', err)
    process.exit(1)
  })
