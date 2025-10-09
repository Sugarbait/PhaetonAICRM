import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('Testing user creation...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserCreation() {
  try {
    console.log('\n=== TEST 1: Insert a test user ===')

    const testUser = {
      id: 'test_' + Date.now(),
      email: 'testuser@test.com',
      name: 'Test User',
      role: 'super_user',
      is_active: true,
      tenant_id: 'artlee',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Attempting to insert:', testUser)

    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select()

    if (error) {
      console.log('❌ Insert failed:', error)
      console.log('Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Insert successful:', data)
    }

    // Try to query the users table
    console.log('\n=== TEST 2: Query users table ===')
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', 'artlee')

    if (queryError) {
      console.log('❌ Query failed:', queryError)
      console.log('Error details:', JSON.stringify(queryError, null, 2))
    } else {
      console.log('✅ Query successful, found', users.length, 'users')
    }

    // Clean up test user
    if (!error && data) {
      console.log('\n=== Cleaning up test user ===')
      await supabase
        .from('users')
        .delete()
        .eq('id', testUser.id)
      console.log('✅ Test user deleted')
    }

  } catch (error) {
    console.error('❌ Test failed with exception:', error)
  }
}

testUserCreation()
