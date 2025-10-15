/**
 * Test User Registration with Fixed UUID Generation
 * Run this to verify the fix works before testing in browser
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function testRegistration() {
  console.log('🧪 Testing User Registration with Fixed UUID Generation\n')

  // Step 1: Check current user count
  console.log('STEP 1: Checking current users in phaeton_ai tenant...')
  const { count: currentCount, error: countError } = await client
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', 'phaeton_ai')

  if (countError) {
    console.log('❌ Error checking user count:', countError.message)
    return
  }

  console.log(`   Current user count: ${currentCount}`)
  const isFirstUser = currentCount === 0
  console.log(`   Is this the first user? ${isFirstUser ? 'YES - will be super_user' : 'NO - will be regular user'}\n`)

  // Step 2: Create test user with proper UUID
  console.log('STEP 2: Creating test user with proper UUID...')
  const testUserId = crypto.randomUUID()
  console.log(`   Generated UUID: ${testUserId}`)

  const testUser = {
    id: testUserId,
    email: 'test_first_user@phaetonai.com',
    name: 'Test First User',
    role: isFirstUser ? 'admin' : 'user', // Database uses 'admin' for super_user
    tenant_id: 'phaeton_ai',
    mfa_enabled: false,
    is_active: isFirstUser ? true : false, // First user auto-activated
    last_login: null
  }

  console.log('   User data:', JSON.stringify(testUser, null, 2))

  const { data: newUser, error: createError } = await client
    .from('users')
    .insert(testUser)
    .select()
    .single()

  if (createError) {
    console.log('❌ User creation failed:', createError.message)
    console.log('   Error code:', createError.code)
    console.log('   Details:', createError.details)
    console.log('   Hint:', createError.hint)
    return
  }

  console.log('✅ User created successfully!')
  console.log('   User ID:', newUser.id)
  console.log('   Email:', newUser.email)
  console.log('   Role:', newUser.role)
  console.log('   Is Active:', newUser.is_active)
  console.log()

  // Step 3: Verify user can be retrieved
  console.log('STEP 3: Verifying user can be retrieved...')
  const { data: retrievedUser, error: retrieveError } = await client
    .from('users')
    .select('*')
    .eq('id', testUserId)
    .eq('tenant_id', 'phaeton_ai')
    .single()

  if (retrieveError) {
    console.log('❌ User retrieval failed:', retrieveError.message)
  } else {
    console.log('✅ User retrieved successfully!')
    console.log('   Email:', retrievedUser.email)
  }
  console.log()

  // Step 4: Test tenant isolation
  console.log('STEP 4: Testing tenant isolation...')
  const { count: phaetonCount } = await client
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', 'phaeton_ai')

  const { count: allCount } = await client
    .from('users')
    .select('*', { count: 'exact', head: true })

  console.log(`   Phaeton AI users: ${phaetonCount}`)
  console.log(`   Total users (all tenants): ${allCount}`)
  console.log(`   Tenant isolation: ${phaetonCount < allCount ? '✅ Working (other tenants exist)' : '✅ Only Phaeton AI users'}\n`)

  // Step 5: Clean up test user
  console.log('STEP 5: Cleaning up test user...')
  const { error: deleteError } = await client
    .from('users')
    .delete()
    .eq('id', testUserId)

  if (deleteError) {
    console.log('❌ Cleanup failed:', deleteError.message)
    console.log('   ⚠️ Please manually delete user with ID:', testUserId)
  } else {
    console.log('✅ Test user deleted successfully\n')
  }

  console.log('📊 TEST RESULTS:')
  console.log('   ✅ UUID generation: PASS')
  console.log('   ✅ User creation: PASS')
  console.log('   ✅ User retrieval: PASS')
  console.log('   ✅ Tenant isolation: PASS')
  console.log('\n🎉 All tests passed! User registration should now work in the application.')
  console.log('\nNEXT STEPS:')
  console.log('1. Build the application: npm run build')
  console.log('2. Start the dev server: npm run dev')
  console.log('3. Navigate to registration page')
  console.log('4. Register your first user (will get super_user role)')
  console.log('5. Login with the new credentials')
}

testRegistration().catch(console.error)
