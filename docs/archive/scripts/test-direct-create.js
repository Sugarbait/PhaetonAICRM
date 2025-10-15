/**
 * Diagnostic Tool: Test Direct User Creation
 * Attempts to create a test user directly to identify exact error
 * Usage: node test-direct-create.js
 */

import { createClient } from '@supabase/supabase-js'

// Phaeton AI CRM Supabase credentials
const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDAyOTUsImV4cCI6MjA2MjQ3NjI5NX0.IfkIVsp3AtLOyXDW9hq9bEvnozd9IaaUay244iDhWGE'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testDirectCreate() {
  console.log('🧪 Testing direct user creation...\n')

  const testUser = {
    email: 'test-diagnostic@test.com',
    name: 'Test Diagnostic User',
    role: 'user',
    is_active: true,
    tenant_id: 'phaeton_ai',
    last_login: null
  }

  console.log('📝 Attempting to create user:')
  console.log(JSON.stringify(testUser, null, 2))
  console.log('\n')

  try {
    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select()

    if (error) {
      console.log('❌ ERROR DETECTED:')
      console.log('   Code:', error.code)
      console.log('   Message:', error.message)
      console.log('   Details:', JSON.stringify(error.details, null, 2))
      console.log('   Hint:', error.hint)

      if (error.code === '23502') {
        console.log('\n🔍 DIAGNOSIS:')
        console.log('   Error code 23502 = "not-null constraint violation"')
        console.log('   This means the users.id column does not have UUID default set')
        console.log('\n💡 FIX:')
        console.log('   Run this SQL in Supabase SQL Editor:')
        console.log('   ')
        console.log('   ALTER TABLE users')
        console.log('   ALTER COLUMN id')
        console.log('   SET DEFAULT gen_random_uuid();')
      }
    } else {
      console.log('✅ SUCCESS! User created:')
      console.log(JSON.stringify(data, null, 2))

      // Clean up test user
      console.log('\n🧹 Cleaning up test user...')
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('email', testUser.email)
        .eq('tenant_id', 'phaeton_ai')

      if (deleteError) {
        console.log('⚠️  Could not delete test user:', deleteError.message)
      } else {
        console.log('✅ Test user deleted')
      }
    }
  } catch (err) {
    console.log('❌ EXCEPTION:', err.message)
  }
}

testDirectCreate()
  .then(() => {
    console.log('\n✅ Test complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Test failed:', err)
    process.exit(1)
  })
