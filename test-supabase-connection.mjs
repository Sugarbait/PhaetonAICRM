#!/usr/bin/env node

/**
 * ARTLEE CRM - Supabase Connection Test Script
 *
 * This script tests the Supabase database connection and performs basic operations
 * to verify that the database is properly configured.
 *
 * Usage:
 *   node test-supabase-connection.mjs
 *
 * Requirements:
 *   - Node.js 18+
 *   - @supabase/supabase-js installed
 *   - .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, '.env.local')
    const envContent = readFileSync(envPath, 'utf-8')
    const envVars = {}

    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        envVars[key] = value
      }
    })

    return envVars
  } catch (error) {
    console.error('❌ Error loading .env.local:', error.message)
    return {}
  }
}

// Main test function
async function testSupabaseConnection() {
  console.log('🔍 ARTLEE CRM - Supabase Connection Test\n')
  console.log('=' .repeat(60))

  // Load environment variables
  const env = loadEnv()
  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

  // Check environment variables
  console.log('\n📋 Environment Variables:')
  console.log(`   VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Loaded' : '❌ Missing'}`)
  console.log(`   VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Loaded' : '❌ Missing'}`)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\n❌ Missing required environment variables in .env.local')
    console.error('   Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set')
    process.exit(1)
  }

  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)

  // Create Supabase client
  console.log('\n🔌 Creating Supabase client...')
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.log('   ✅ Client created')

  // Test 1: Check users table
  console.log('\n📊 Test 1: Query users table')
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('tenant_id', 'artlee')

    if (error) {
      console.error(`   ❌ Error: ${error.message}`)
      console.error(`   Code: ${error.code}`)
      console.error(`   Details: ${JSON.stringify(error.details)}`)
    } else {
      console.log(`   ✅ Success: Found ${count} users`)
      if (data && data.length > 0) {
        console.log(`   Sample user: ${data[0].email}`)
      }
    }
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`)
  }

  // Test 2: Check user_profiles table
  console.log('\n📊 Test 2: Query user_profiles table')
  try {
    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .eq('tenant_id', 'artlee')

    if (error) {
      console.error(`   ❌ Error: ${error.message}`)
      console.error(`   Code: ${error.code}`)
    } else {
      console.log(`   ✅ Success: Found ${count} profiles`)
    }
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`)
  }

  // Test 3: Check user_settings table
  console.log('\n📊 Test 3: Query user_settings table')
  try {
    const { data, error, count } = await supabase
      .from('user_settings')
      .select('*', { count: 'exact' })
      .eq('tenant_id', 'artlee')

    if (error) {
      console.error(`   ❌ Error: ${error.message}`)
      console.error(`   Code: ${error.code}`)
    } else {
      console.log(`   ✅ Success: Found ${count} settings`)
    }
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`)
  }

  // Test 4: Check audit_logs table
  console.log('\n📊 Test 4: Query audit_logs table')
  try {
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', 'artlee')
      .limit(5)

    if (error) {
      console.error(`   ❌ Error: ${error.message}`)
      console.error(`   Code: ${error.code}`)
    } else {
      console.log(`   ✅ Success: Found ${count} audit logs`)
    }
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`)
  }

  // Test 5: Try to insert into failed_login_attempts
  console.log('\n📊 Test 5: Insert into failed_login_attempts')
  try {
    const testData = {
      email: 'test@test.com',
      ip_address: '127.0.0.1',
      user_agent: 'Test Script',
      tenant_id: 'artlee',
      attempted_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('failed_login_attempts')
      .insert(testData)
      .select()

    if (error) {
      console.error(`   ❌ Error: ${error.message}`)
      console.error(`   Code: ${error.code}`)
      console.error(`   Details: ${JSON.stringify(error.details)}`)
    } else {
      console.log(`   ✅ Success: Inserted test record`)

      // Clean up: Delete the test record
      const deleteResult = await supabase
        .from('failed_login_attempts')
        .delete()
        .eq('email', 'test@test.com')

      if (!deleteResult.error) {
        console.log(`   ✅ Cleaned up test record`)
      }
    }
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`)
  }

  // Test 6: Try to insert into users (should fail if user exists)
  console.log('\n📊 Test 6: Insert into users table')
  try {
    const testUserId = 'test_' + Date.now()
    const testData = {
      id: testUserId,
      email: 'testuser@test.com',
      tenant_id: 'artlee',
      role: 'user',
      is_active: true,
      name: 'Test User'
    }

    const { data, error } = await supabase
      .from('users')
      .insert(testData)
      .select()

    if (error) {
      console.error(`   ❌ Error: ${error.message}`)
      console.error(`   Code: ${error.code}`)
    } else {
      console.log(`   ✅ Success: Inserted test user`)

      // Clean up: Delete the test user
      const deleteResult = await supabase
        .from('users')
        .delete()
        .eq('id', testUserId)

      if (!deleteResult.error) {
        console.log(`   ✅ Cleaned up test user`)
      }
    }
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`)
  }

  // Test 7: Check company_settings table
  console.log('\n📊 Test 7: Query company_settings table')
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('tenant_id', 'artlee')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`   ⚠️  No company settings found (this is OK for new database)`)
      } else {
        console.error(`   ❌ Error: ${error.message}`)
        console.error(`   Code: ${error.code}`)
      }
    } else {
      console.log(`   ✅ Success: Found company settings`)
      console.log(`   Company Name: ${data?.data?.company_name || 'Not set'}`)
    }
  } catch (err) {
    console.error(`   ❌ Exception: ${err.message}`)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📝 Summary:')
  console.log('   If you see ✅ marks above, the database is accessible')
  console.log('   If you see ❌ marks, check the error messages for details')
  console.log('\n💡 Common Issues:')
  console.log('   • 406 errors → Check RLS policies and grants')
  console.log('   • 400 errors → Check table structure and constraints')
  console.log('   • No data → Database is empty (expected for new setup)')
  console.log('\n📚 Next Steps:')
  console.log('   1. If tests failed, run FIX_406_400_ERRORS.sql in Supabase SQL Editor')
  console.log('   2. If tests passed, try logging in to ARTLEE app')
  console.log('   3. Check browser console for frontend-specific errors')
  console.log('\n')
}

// Run the test
testSupabaseConnection().catch(error => {
  console.error('\n❌ Unexpected error:', error)
  process.exit(1)
})
