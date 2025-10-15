/**
 * Test Registration INSERT - Diagnostic Script
 *
 * This script tests if INSERT operations work for the users table in Supabase.
 * It checks RLS policies, connection, and database permissions.
 *
 * Usage: node test-registration-insert.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// Load environment variables
const supabaseUrl = 'https://cpkslvmydfdevdftieck.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDAyOTUsImV4cCI6MjA2MjQ3NjI5NX0.IfkIVsp3AtLOyXDW9hq9bEvnozd9IaaUay244iDhWGE'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

console.log('🔍 TEST: Registration INSERT Diagnostic Script\n')
console.log('=' . repeat(60))

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

console.log('✅ Supabase clients created\n')

async function runDiagnostics() {
  // TEST 1: Check database connection
  console.log('📡 TEST 1: Checking Supabase connection...')
  try {
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1)
    if (error) {
      console.error('❌ Connection test FAILED:', error.message)
      console.error('   Details:', JSON.stringify(error, null, 2))
      return false
    }
    console.log('✅ Connection test PASSED\n')
  } catch (err) {
    console.error('❌ Connection test FAILED with exception:', err.message)
    return false
  }

  // TEST 2: Check existing users count
  console.log('👥 TEST 2: Checking existing users...')
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('tenant_id', 'phaeton_ai')

    if (error) {
      console.error('❌ User count query FAILED:', error.message)
      return false
    }

    console.log(`✅ Found ${users.length} existing users with tenant_id='phaeton_ai'`)
    if (users.length > 0) {
      console.log('   Sample user:', {
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        tenant_id: users[0].tenant_id
      })
    }
    console.log('')
  } catch (err) {
    console.error('❌ User count query FAILED:', err.message)
    return false
  }

  // TEST 3: Check RLS policies using anon key (what registration uses)
  console.log('🔐 TEST 3: Checking RLS policies with ANON key...')
  try {
    const { data: usersAnon, error: rlsError } = await supabaseAnon
      .from('users')
      .select('id, email, role')
      .eq('tenant_id', 'phaeton_ai')
      .limit(1)

    if (rlsError) {
      console.warn('⚠️  RLS policy blocks SELECT for anon users (expected for security)')
      console.log('   Error:', rlsError.message)
      console.log('   This means INSERT policy must explicitly allow anon users\n')
    } else {
      console.log('✅ RLS allows SELECT for anon users (policy is permissive)')
      console.log(`   Found ${usersAnon?.length || 0} users\n`)
    }
  } catch (err) {
    console.error('❌ RLS check FAILED:', err.message)
  }

  // TEST 4: Attempt INSERT with ANON key (what registration uses)
  console.log('🔨 TEST 4: Testing INSERT with ANON key (registration scenario)...')
  const testUserId = randomUUID()
  const testEmail = `test-${Date.now()}@test.com`

  try {
    const { data: insertedUser, error: insertError } = await supabaseAnon
      .from('users')
      .insert({
        id: testUserId,
        email: testEmail,
        name: 'Test User',
        role: 'user',
        mfa_enabled: false,
        is_active: false, // Pending approval
        tenant_id: 'phaeton_ai',
        last_login: null
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ INSERT with ANON key FAILED')
      console.error('   Error:', insertError.message)
      console.error('   Code:', insertError.code)
      console.error('   Details:', insertError.details)
      console.error('   Hint:', insertError.hint || 'No hint provided')
      console.log('\n🔍 DIAGNOSIS:')

      if (insertError.code === '42501') {
        console.log('   → RLS policy is blocking INSERT for anonymous users')
        console.log('   → Need to create RLS policy: ALLOW INSERT for anon role')
        console.log('   → Policy should check: auth.role() = \'anon\' AND NEW.role != \'super_user\'')
      } else if (insertError.code === '23505') {
        console.log('   → Duplicate key violation (user already exists)')
      } else if (insertError.code === '23503') {
        console.log('   → Foreign key violation (related table issue)')
      } else {
        console.log(`   → Unknown error code: ${insertError.code}`)
      }
      console.log('')
      return false
    }

    console.log('✅ INSERT with ANON key SUCCEEDED!')
    console.log('   Created user:', {
      id: insertedUser.id,
      email: insertedUser.email,
      role: insertedUser.role,
      tenant_id: insertedUser.tenant_id,
      is_active: insertedUser.is_active
    })
    console.log('')

    // TEST 5: Cleanup - delete test user
    console.log('🧹 TEST 5: Cleaning up test user...')
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', testUserId)

    if (deleteError) {
      console.warn('⚠️  Could not delete test user:', deleteError.message)
    } else {
      console.log('✅ Test user deleted successfully\n')
    }

    return true
  } catch (err) {
    console.error('❌ INSERT test FAILED with exception:', err.message)
    console.error('   Stack:', err.stack)
    return false
  }
}

// TEST 6: Check RLS policies via SQL
async function checkRLSPolicies() {
  console.log('📋 TEST 6: Checking RLS policies via SQL...')
  try {
    const { data: policies, error } = await supabaseAdmin.rpc('get_policies', {
      schema_name: 'public',
      table_name: 'users'
    }).catch(() => {
      // If RPC doesn't exist, try direct query
      return supabaseAdmin
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'users')
    })

    if (error) {
      console.warn('⚠️  Could not fetch RLS policies (requires admin access)')
      console.log('   Error:', error.message)
    } else if (policies && policies.length > 0) {
      console.log('✅ Found RLS policies:')
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} for ${policy.roles}`)
      })
    } else {
      console.log('⚠️  No RLS policies found for users table')
    }
    console.log('')
  } catch (err) {
    console.warn('⚠️  Could not check RLS policies:', err.message)
  }
}

// TEST 7: Attempt INSERT with pierre@phaetonai.com
async function testPierreRegistration() {
  console.log('👤 TEST 7: Testing registration for pierre@phaetonai.com...')

  // Check if Pierre already exists
  const { data: existingPierre, error: checkError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', 'pierre@phaetonai.com')
    .eq('tenant_id', 'phaeton_ai')

  if (checkError) {
    console.error('❌ Could not check for existing Pierre account:', checkError.message)
    return
  }

  if (existingPierre && existingPierre.length > 0) {
    console.log('✅ Pierre account already exists:')
    console.log('   ID:', existingPierre[0].id)
    console.log('   Email:', existingPierre[0].email)
    console.log('   Role:', existingPierre[0].role)
    console.log('   Active:', existingPierre[0].is_active)
    console.log('   Tenant:', existingPierre[0].tenant_id)
    console.log('\n   → Registration should show "User already exists" error\n')
    return
  }

  console.log('❌ Pierre account NOT FOUND')
  console.log('   → This explains why registration appears to fail')
  console.log('   → User is filling form but INSERT is not happening\n')

  // Try to create Pierre with ANON key
  console.log('🔨 Attempting to create Pierre with ANON key...')
  const pierreId = randomUUID()

  try {
    const { data: newPierre, error: insertError } = await supabaseAnon
      .from('users')
      .insert({
        id: pierreId,
        email: 'pierre@phaetonai.com',
        name: 'Pierre Morenzie',
        role: 'super_user', // First user should be super_user
        mfa_enabled: false,
        is_active: true, // First user auto-activated
        tenant_id: 'phaeton_ai',
        last_login: null
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Failed to create Pierre account:')
      console.error('   Error:', insertError.message)
      console.error('   Code:', insertError.code)
      console.error('   Details:', insertError.details)
      console.error('   Hint:', insertError.hint)
      console.log('\n🔍 ROOT CAUSE IDENTIFIED:')
      console.log('   → RLS policy is blocking INSERT for anonymous users')
      console.log('   → Need to add RLS policy allowing registration\n')
    } else {
      console.log('✅ Pierre account created successfully!')
      console.log('   ID:', newPierre.id)
      console.log('   Email:', newPierre.email)
      console.log('   Role:', newPierre.role)
      console.log('   Active:', newPierre.is_active)
      console.log('\n   → Now try logging in with this account\n')
    }
  } catch (err) {
    console.error('❌ Exception creating Pierre:', err.message)
  }
}

// Run all diagnostics
async function main() {
  console.log('Starting diagnostics...\n')

  const connectionOk = await runDiagnostics()
  await checkRLSPolicies()
  await testPierreRegistration()

  console.log('=' . repeat(60))
  console.log('📊 SUMMARY:')
  console.log('=' . repeat(60))

  if (connectionOk) {
    console.log('✅ Database connection: WORKING')
    console.log('✅ Admin operations: WORKING')
    console.log('❓ Anonymous INSERT: Check logs above')
    console.log('\n🔍 Next Steps:')
    console.log('   1. Check RLS policies in Supabase dashboard')
    console.log('   2. Add policy: ALLOW INSERT for anon role')
    console.log('   3. Policy should prevent super_user creation by anon')
    console.log('   4. First user detection should use service role\n')
  } else {
    console.log('❌ Connection or basic operations FAILED')
    console.log('\n🔍 Check:')
    console.log('   1. Supabase credentials are correct')
    console.log('   2. Network connection is working')
    console.log('   3. Supabase service is online\n')
  }
}

main().catch(console.error)
