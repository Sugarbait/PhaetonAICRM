#!/usr/bin/env node

/**
 * Test User Creation Script for CareXPS
 *
 * This script tests that user creation works properly after the schema fix
 */

import { createClient } from '@supabase/supabase-js'

console.log('🧪 CareXPS User Creation Test')
console.log('============================')

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - VITE_SUPABASE_URL')
  console.error('   - VITE_SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('Please check your .env.local file')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserCreation() {
  try {
    console.log('🔍 Testing database schema...')

    // Test 1: Check if users table has azure_ad_id column
    const { data: schemaTest, error: schemaError } = await supabase
      .from('users')
      .select('id, email, azure_ad_id, name, role')
      .limit(1)

    if (schemaError) {
      console.error('❌ Schema test failed:', schemaError.message)
      return false
    }

    console.log('✅ Users table schema verified')

    // Test 2: Check if user_profiles table exists
    const { data: profilesTest, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, user_id')
      .limit(1)

    if (profilesError) {
      console.error('❌ User profiles table test failed:', profilesError.message)
      return false
    }

    console.log('✅ User profiles table verified')

    // Test 3: Create a test user
    console.log('')
    console.log('👤 Testing user creation...')

    const testUser = {
      email: 'test-schema-fix@carexps.com',
      name: 'Schema Test User',
      role: 'staff',
      azure_ad_id: `test_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      mfa_enabled: false,
      is_active: true,
      metadata: {
        created_via: 'schema_test',
        test_timestamp: new Date().toISOString()
      }
    }

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single()

    if (createError) {
      console.error('❌ User creation test failed:', createError.message)
      return false
    }

    console.log('✅ User created successfully:', newUser.email)

    // Test 4: Create corresponding user profile
    const testProfile = {
      user_id: newUser.id,
      display_name: 'Schema Test User',
      department: 'Testing',
      metadata: {
        test_profile: true
      }
    }

    const { data: newProfile, error: profileCreateError } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()
      .single()

    if (profileCreateError) {
      console.error('❌ User profile creation test failed:', profileCreateError.message)
      return false
    }

    console.log('✅ User profile created successfully')

    // Test 5: Clean up test data
    console.log('')
    console.log('🧹 Cleaning up test data...')

    await supabase.from('user_profiles').delete().eq('id', newProfile.id)
    await supabase.from('users').delete().eq('id', newUser.id)

    console.log('✅ Test data cleaned up')

    return true

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message)
    return false
  }
}

async function checkExistingUsers() {
  try {
    console.log('')
    console.log('📊 Checking existing users...')

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Failed to fetch users:', error.message)
      return
    }

    console.log(`📋 Found ${users.length} users in database:`)
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name}) - ${user.role}`)
    })

  } catch (error) {
    console.error('❌ Failed to check existing users:', error.message)
  }
}

async function main() {
  console.log('Starting comprehensive user creation test...')
  console.log('')

  const success = await testUserCreation()

  if (success) {
    console.log('')
    console.log('🎉 All tests passed!')
    console.log('')
    console.log('✨ Schema fix verification:')
    console.log('   • Users table has required azure_ad_id column')
    console.log('   • User profiles table exists and works')
    console.log('   • User creation works without 400 errors')
    console.log('   • Profile creation works properly')
    console.log('')
    console.log('🚀 Ready for production use!')

    await checkExistingUsers()

  } else {
    console.log('')
    console.log('❌ Tests failed!')
    console.log('')
    console.log('💡 Next steps:')
    console.log('   1. Apply the database migration first:')
    console.log('      node apply-database-schema-fix.js')
    console.log('   2. Check your Supabase permissions')
    console.log('   3. Verify your environment variables')
    process.exit(1)
  }
}

main()