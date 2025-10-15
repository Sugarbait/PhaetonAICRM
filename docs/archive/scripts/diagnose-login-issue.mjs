#!/usr/bin/env node

/**
 * Diagnose Login Issue
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Diagnosing Login Issue...\n')
console.log('=' .repeat(60))

// Check 1: Verify user exists
console.log('\n📋 TEST 1: Check if user exists in database')
console.log('-'.repeat(60))

const testEmail = 'pierre@phaetonai.com'

try {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', testEmail)

  if (error) {
    console.error('❌ Error querying users:', error.message)
  } else if (!users || users.length === 0) {
    console.error('❌ USER NOT FOUND IN DATABASE!')
    console.log('   This is the problem - user record missing')
  } else {
    console.log('✅ User found in database')
    console.log(`   ID: ${users[0].id}`)
    console.log(`   Email: ${users[0].email}`)
    console.log(`   Tenant: ${users[0].tenant_id}`)
    console.log(`   Active: ${users[0].is_active}`)
    console.log(`   Role: ${users[0].role}`)
  }
} catch (err) {
  console.error('❌ Error:', err.message)
}

// Check 2: Test Supabase Auth
console.log('\n\n🔐 TEST 2: Check Supabase Auth status')
console.log('-'.repeat(60))

try {
  // Try to get user from Supabase Auth (not our users table)
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.log('⚠️  Cannot list auth users (may need different permissions)')
  } else {
    console.log(`Found ${authData.users.length} users in Supabase Auth`)

    const authUser = authData.users.find(u => u.email === testEmail)
    if (authUser) {
      console.log('✅ User exists in Supabase Auth')
      console.log(`   Email: ${authUser.email}`)
      console.log(`   Created: ${authUser.created_at}`)
    } else {
      console.log('⚠️  User NOT in Supabase Auth (using database-only auth)')
    }
  }
} catch (err) {
  console.log('⚠️  Auth check skipped:', err.message)
}

// Check 3: Verify password exists
console.log('\n\n🔑 TEST 3: Check if password credentials exist')
console.log('-'.repeat(60))

try {
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('user_id, encrypted_retell_api_key')
    .eq('user_id', '166b5086-5ec5-49f3-9eff-68f75d0c8e79') // Pierre's ID

  if (error) {
    console.log('⚠️  Cannot query user_profiles:', error.message)
  } else if (!profiles || profiles.length === 0) {
    console.log('⚠️  No profile found')
  } else {
    console.log('✅ User profile exists')
    console.log(`   Has encrypted credentials: ${!!profiles[0].encrypted_retell_api_key}`)
  }
} catch (err) {
  console.error('❌ Error:', err.message)
}

console.log('\n\n' + '='.repeat(60))
console.log('📊 DIAGNOSIS SUMMARY')
console.log('='.repeat(60))

console.log('\nMost likely causes:')
console.log('1. Wrong password being entered')
console.log('2. User record exists but password not matching')
console.log('3. Database changes affected authentication')
console.log('\n🔧 TO FIX: Try using the correct password')
console.log('   Email: pierre@phaetonai.com')
console.log('   Check if caps lock is on')
console.log('')
