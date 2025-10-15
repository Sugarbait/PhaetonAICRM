/**
 * Real-time Tenant Isolation Diagnostic Tool
 *
 * This script checks the actual tenant_id values in the database
 * for specific users to diagnose the tenant isolation bug.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

async function checkTenantIsolation() {
  console.log('\n🔍 === REAL-TIME TENANT ISOLATION CHECK ===\n')

  // Check specific users
  const emailsToCheck = ['artlee@email.com', 'medex@email.com', 'elmfarrell@yahoo.com', 'guest@email.com']

  for (const email of emailsToCheck) {
    console.log(`\n📧 Checking user: ${email}`)

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, tenant_id, created_at')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`   ❌ User NOT found in database`)
      } else {
        console.log(`   ❌ Error: ${error.message}`)
      }
      continue
    }

    if (user) {
      console.log(`   ✅ Found in database:`)
      console.log(`      - tenant_id: "${user.tenant_id}"`)
      console.log(`      - name: ${user.name}`)
      console.log(`      - role: ${user.role}`)
      console.log(`      - created_at: ${user.created_at}`)

      // Verify correct tenant
      const expectedTenant = email.includes('artlee') ? 'artlee'
                           : email.includes('medex') ? 'medex'
                           : 'carexps'

      if (user.tenant_id === expectedTenant) {
        console.log(`      ✅ CORRECT tenant_id (expected: ${expectedTenant})`)
      } else {
        console.log(`      ❌ WRONG tenant_id! (expected: ${expectedTenant}, got: ${user.tenant_id})`)
      }
    }
  }

  // Check what CareXPS query would return
  console.log(`\n\n🔍 === SIMULATING CAREXPS QUERY ===`)
  console.log(`Query: SELECT * FROM users WHERE tenant_id = 'carexps'\n`)

  const { data: carexpsUsers, error: carexpsError } = await supabase
    .from('users')
    .select('id, email, name, role, tenant_id')
    .eq('tenant_id', 'carexps')

  if (carexpsError) {
    console.log(`❌ Query error: ${carexpsError.message}`)
  } else {
    console.log(`✅ Found ${carexpsUsers?.length || 0} users with tenant_id = 'carexps':`)
    carexpsUsers?.forEach(user => {
      console.log(`   - ${user.email} (tenant_id: ${user.tenant_id})`)
    })
  }

  // Check what ARTLEE query would return
  console.log(`\n\n🔍 === SIMULATING ARTLEE QUERY ===`)
  console.log(`Query: SELECT * FROM users WHERE tenant_id = 'artlee'\n`)

  const { data: artleeUsers, error: artleeError } = await supabase
    .from('users')
    .select('id, email, name, role, tenant_id')
    .eq('tenant_id', 'artlee')

  if (artleeError) {
    console.log(`❌ Query error: ${artleeError.message}`)
  } else {
    console.log(`✅ Found ${artleeUsers?.length || 0} users with tenant_id = 'artlee':`)
    artleeUsers?.forEach(user => {
      console.log(`   - ${user.email} (tenant_id: ${user.tenant_id})`)
    })
  }

  // Check what MedEx query would return
  console.log(`\n\n🔍 === SIMULATING MEDEX QUERY ===`)
  console.log(`Query: SELECT * FROM users WHERE tenant_id = 'medex'\n`)

  const { data: medexUsers, error: medexError } = await supabase
    .from('users')
    .select('id, email, name, role, tenant_id')
    .eq('tenant_id', 'medex')

  if (medexError) {
    console.log(`❌ Query error: ${medexError.message}`)
  } else {
    console.log(`✅ Found ${medexUsers?.length || 0} users with tenant_id = 'medex':`)
    medexUsers?.forEach(user => {
      console.log(`   - ${user.email} (tenant_id: ${user.tenant_id})`)
    })
  }

  console.log(`\n\n🔍 === ALL USERS IN DATABASE (NO FILTER) ===\n`)

  const { data: allUsers, error: allError } = await supabase
    .from('users')
    .select('id, email, name, role, tenant_id, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (allError) {
    console.log(`❌ Query error: ${allError.message}`)
  } else {
    console.log(`✅ Last 20 users created:\n`)
    allUsers?.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   tenant_id: "${user.tenant_id}"`)
      console.log(`   role: ${user.role}`)
      console.log(`   created_at: ${user.created_at}\n`)
    })
  }

  console.log('\n=== END OF REPORT ===\n')
}

checkTenantIsolation()
  .then(() => {
    console.log('✅ Diagnostic complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Diagnostic failed:', error)
    process.exit(1)
  })
