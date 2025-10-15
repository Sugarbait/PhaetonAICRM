#!/usr/bin/env node

/**
 * Diagnose Failed Login Attempts Table
 * Check if failed login tracking is working
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Diagnosing Failed Login Attempts Table...\n')
console.log('=' .repeat(60))

// Test 1: Check existing records
console.log('\n📋 TEST 1: Check existing failed login attempts')
console.log('-'.repeat(60))

try {
  const { data, error } = await supabase
    .from('failed_login_attempts')
    .select('*')
    .order('attempted_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error querying table:', error.message)
  } else {
    console.log(`✅ Found ${data.length} existing records`)
    if (data.length > 0) {
      console.log('\nMost recent attempts:')
      data.forEach((record, i) => {
        console.log(`   ${i + 1}. Email: ${record.email}`)
        console.log(`      Time: ${record.attempted_at}`)
        console.log(`      IP: ${record.ip_address || 'N/A'}`)
        console.log(`      Reason: ${record.reason || 'N/A'}`)
      })
    }
  }
} catch (err) {
  console.error('❌ Error:', err.message)
}

// Test 2: Try to insert a test record
console.log('\n\n🧪 TEST 2: Test inserting new failed login attempt')
console.log('-'.repeat(60))

try {
  const testData = {
    email: 'test@example.com',
    ip_address: '127.0.0.1',
    user_agent: 'Test Agent',
    reason: 'Test insert',
    attempted_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('failed_login_attempts')
    .insert(testData)
    .select()

  if (error) {
    console.error('❌ Insert FAILED:', error.message)
    console.log('\n🔧 This is why login attempts aren\'t counting down!')

    if (error.message.includes('attempted_at')) {
      console.log('   Issue: attempted_at column problem')
      console.log('   Solution: Run migration to fix column names')
    } else if (error.message.includes('null value')) {
      console.log('   Issue: Required field missing')
      console.log('   Solution: Check table schema')
    } else {
      console.log('   Issue:', error.message)
    }
  } else {
    console.log('✅ Insert SUCCESSFUL!')
    console.log(`   Record ID: ${data[0].id}`)

    // Clean up test record
    await supabase
      .from('failed_login_attempts')
      .delete()
      .eq('email', 'test@example.com')

    console.log('✅ Test record cleaned up')
    console.log('\n🎉 Failed login tracking should be working!')
  }
} catch (err) {
  console.error('❌ Error:', err.message)
}

// Test 3: Check RLS policies
console.log('\n\n🔐 TEST 3: Check RLS policies')
console.log('-'.repeat(60))

try {
  // Try as anonymous user
  const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY)

  const testData = {
    email: 'anon-test@example.com',
    ip_address: '127.0.0.1',
    user_agent: 'Anon Test',
    reason: 'Anonymous test',
    attempted_at: new Date().toISOString()
  }

  const { data, error } = await anonClient
    .from('failed_login_attempts')
    .insert(testData)
    .select()

  if (error) {
    console.log('⚠️  Anonymous insert blocked (this might be intentional)')
    console.log('   Error:', error.message)
  } else {
    console.log('✅ Anonymous users CAN insert (good for login page)')

    // Clean up
    await supabase
      .from('failed_login_attempts')
      .delete()
      .eq('email', 'anon-test@example.com')
  }
} catch (err) {
  console.error('❌ Error:', err.message)
}

console.log('\n\n' + '='.repeat(60))
console.log('📊 DIAGNOSIS COMPLETE')
console.log('='.repeat(60))
console.log('')
