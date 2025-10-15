/**
 * Diagnostic Script for User Registration Issues
 * Run this in Node.js to test Supabase connection and permissions
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDAyOTUsImV4cCI6MjA2MjQ3NjI5NX0.IfkIVsp3AtLOyXDW9hq9bEvnozd9IaaUay244iDhWGE'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

async function diagnoseRegistration() {
  console.log('🔍 DIAGNOSTIC: Starting Supabase Registration Diagnosis\n')

  // Test 1: Anonymous client connection
  console.log('TEST 1: Testing anonymous client connection...')
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    const { data, error } = await anonClient.from('users').select('count').single()
    if (error) {
      console.log('❌ Anonymous connection failed:', error.message)
      console.log('   This is expected if RLS is enabled without public access')
    } else {
      console.log('✅ Anonymous connection successful')
    }
  } catch (err) {
    console.log('❌ Anonymous connection error:', err.message)
  }

  // Test 2: Service role client connection
  console.log('\nTEST 2: Testing service role client connection...')
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const { count, error } = await serviceClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', 'phaeton_ai')

    if (error) {
      console.log('❌ Service role connection failed:', error.message)
      console.log('   ERROR DETAILS:', error)
    } else {
      console.log('✅ Service role connection successful')
      console.log('   Current user count (tenant_id=phaeton_ai):', count)
    }
  } catch (err) {
    console.log('❌ Service role connection error:', err.message)
  }

  // Test 3: Check if Supabase Auth is enabled
  console.log('\nTEST 3: Testing Supabase Auth availability...')
  try {
    const { data, error } = await anonClient.auth.signUp({
      email: 'test_diagnostic_user@test.com',
      password: 'TestPassword123!'
    })

    if (error) {
      console.log('❌ Supabase Auth signup failed:', error.message)
      if (error.message.includes('Email signups are disabled')) {
        console.log('   🔒 CRITICAL: Email/password authentication is DISABLED in Supabase')
        console.log('   📝 FIX: Enable email authentication in Supabase Dashboard')
        console.log('   Go to: Authentication → Providers → Email → Enable')
      }
    } else {
      console.log('✅ Supabase Auth is enabled')
      // Clean up test user
      await serviceClient.auth.admin.deleteUser(data.user.id)
    }
  } catch (err) {
    console.log('❌ Supabase Auth error:', err.message)
  }

  // Test 4: Try to create a test user with service role
  console.log('\nTEST 4: Testing user creation with service role...')
  const testUserId = `test_${Date.now()}`
  try {
    const { data: newUser, error: createError } = await serviceClient
      .from('users')
      .insert({
        id: testUserId,
        email: 'test_diagnostic_user@test.com',
        name: 'Test Diagnostic User',
        role: 'user',
        tenant_id: 'phaeton_ai',
        mfa_enabled: false,
        is_active: true,
        last_login: null
      })
      .select()
      .single()

    if (createError) {
      console.log('❌ User creation failed:', createError.message)
      console.log('   ERROR CODE:', createError.code)
      console.log('   ERROR DETAILS:', createError.details)
      console.log('   ERROR HINT:', createError.hint)
    } else {
      console.log('✅ User creation successful')
      console.log('   Created user:', newUser)

      // Clean up test user
      await serviceClient.from('users').delete().eq('id', testUserId)
      console.log('   Cleaned up test user')
    }
  } catch (err) {
    console.log('❌ User creation error:', err.message)
  }

  // Test 5: Check RLS policies
  console.log('\nTEST 5: Checking RLS policies on users table...')
  try {
    const { data: policies, error: policyError } = await serviceClient
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users')

    if (policyError) {
      console.log('❌ Could not fetch RLS policies:', policyError.message)
    } else if (!policies || policies.length === 0) {
      console.log('⚠️ No RLS policies found on users table')
      console.log('   This could mean RLS is not enabled')
    } else {
      console.log('✅ Found RLS policies on users table:')
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd}): ${policy.qual}`)
      })
    }
  } catch (err) {
    console.log('⚠️ Could not check RLS policies:', err.message)
  }

  console.log('\n📊 DIAGNOSIS COMPLETE\n')
  console.log('RECOMMENDATIONS:')
  console.log('1. If Supabase Auth is disabled, enable it in Dashboard → Authentication → Providers')
  console.log('2. Check RLS policies allow INSERT for authenticated users or service role')
  console.log('3. Verify tenant_id column exists and accepts "phaeton_ai" value')
  console.log('4. Consider using service role key for user registration if RLS blocks anon key')
}

// Run diagnosis
diagnoseRegistration().catch(console.error)
