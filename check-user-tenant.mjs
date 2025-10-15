import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cpkslvmydfdevdftieck.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDAyOTUsImV4cCI6MjA2MjQ3NjI5NX0.IfkIVsp3AtLOyXDW9hq9bEvnozd9IaaUay244iDhWGE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUserTenant() {
  const userId = 'a5a5337a-4369-415c-9cb6-eb01b4034131'
  
  console.log(`\n🔍 Checking tenant_id for user: ${userId}\n`)
  
  // Query WITHOUT tenant filter to see what's actually in the database
  const { data, error } = await supabase
    .from('users')
    .select('id, email, tenant_id, is_active, role')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('❌ Error querying user:', error)
    return
  }
  
  if (!data) {
    console.log('❌ User not found in database')
    return
  }
  
  console.log('✅ User found:')
  console.log('   Email:', data.email)
  console.log('   Tenant ID:', data.tenant_id)
  console.log('   Is Active:', data.is_active)
  console.log('   Role:', data.role)
  console.log()
  
  // Now check if a query WITH tenant_id filter would match
  const { data: withTenant, error: tenantError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .eq('tenant_id', 'phaeton_ai')
  
  if (tenantError) {
    console.error('❌ Error with tenant filter:', tenantError)
  } else if (withTenant && withTenant.length > 0) {
    console.log('✅ User WOULD be found with tenant_id="phaeton_ai" filter')
  } else {
    console.log('❌ User NOT found with tenant_id="phaeton_ai" filter')
    console.log('   This is why the update is failing!')
    console.log()
    console.log('💡 Solution: Update user tenant_id to "phaeton_ai"')
  }
}

checkUserTenant()
