/**
 * Test Registration - Debug Supabase User Creation
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUserCreation() {
  try {
    console.log('🧪 Testing user creation for ARTLEE tenant...\n')

    const testUser = {
      email: 'test-' + Date.now() + '@test.com',
      name: 'Test User',
      role: 'admin', // Database expects 'admin' not 'super_user'
      azure_ad_id: `placeholder_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      mfa_enabled: false,
      is_active: true,
      last_login: null,
      metadata: {
        created_via: 'test_script',
        original_role: 'super_user'
      },
      tenant_id: 'artlee'
    }

    console.log('📝 Attempting to create user with data:')
    console.log(JSON.stringify(testUser, null, 2))
    console.log('')

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single()

    if (userError) {
      console.error('❌ SUPABASE INSERT ERROR:')
      console.error('Message:', userError.message)
      console.error('Details:', userError.details)
      console.error('Hint:', userError.hint)
      console.error('Code:', userError.code)
      console.error('\nFull Error:', JSON.stringify(userError, null, 2))
      return
    }

    console.log('✅ User created successfully!')
    console.log('User ID:', newUser.id)
    console.log('Email:', newUser.email)
    console.log('Tenant:', newUser.tenant_id)
    console.log('Role:', newUser.role)
    console.log('\nFull User:', JSON.stringify(newUser, null, 2))

    // Clean up - delete test user
    console.log('\n🗑️  Cleaning up test user...')
    await supabase.from('users').delete().eq('id', newUser.id)
    console.log('✅ Test user deleted')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testUserCreation()
