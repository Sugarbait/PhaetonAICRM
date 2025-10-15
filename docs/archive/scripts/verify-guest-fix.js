/**
 * Verification Script - Confirm guest@guest.com Fix
 *
 * This script verifies that all fixes were applied correctly
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('\n✅ VERIFICATION: Guest Authentication Fix\n')
console.log('=' .repeat(60))

async function verify() {
  const guestEmail = 'guest@guest.com'
  const expectedId = '766134df-6bc2-4e07-a0cc-b009c8b889cc'
  let allChecks = []

  // Check 1: Supabase Auth user
  console.log('\n1️⃣  Checking Supabase Auth User...')
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const authUser = authUsers.users.find(u => u.email === guestEmail)

  if (authUser && authUser.id === expectedId) {
    console.log('   ✅ PASS: Auth user exists with correct ID')
    allChecks.push(true)
  } else {
    console.log('   ❌ FAIL: Auth user ID mismatch or not found')
    allChecks.push(false)
  }

  // Check 2: users table record
  console.log('\n2️⃣  Checking users Table Record...')
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', guestEmail)
    .single()

  if (user && user.id === expectedId) {
    console.log('   ✅ PASS: User record exists with correct ID')
    allChecks.push(true)
  } else {
    console.log('   ❌ FAIL: User record ID mismatch or not found')
    allChecks.push(false)
  }

  // Check 3: ID match verification
  console.log('\n3️⃣  Verifying ID Synchronization...')
  if (authUser && user && authUser.id === user.id) {
    console.log('   ✅ PASS: Auth ID and users table ID match perfectly')
    console.log(`      Both IDs: ${authUser.id}`)
    allChecks.push(true)
  } else {
    console.log('   ❌ FAIL: IDs do not match')
    allChecks.push(false)
  }

  // Check 4: User role
  console.log('\n4️⃣  Checking User Role...')
  if (user && user.role === 'super_user') {
    console.log('   ✅ PASS: User role is super_user')
    allChecks.push(true)
  } else {
    console.log(`   ❌ FAIL: User role is ${user?.role || 'unknown'}`)
    allChecks.push(false)
  }

  // Check 5: Tenant ID
  console.log('\n5️⃣  Checking Tenant Isolation...')
  if (user && user.tenant_id === 'artlee') {
    console.log('   ✅ PASS: User tenant_id is artlee')
    allChecks.push(true)
  } else {
    console.log(`   ❌ FAIL: User tenant_id is ${user?.tenant_id || 'unknown'}`)
    allChecks.push(false)
  }

  // Check 6: user_settings
  console.log('\n6️⃣  Checking user_settings...')
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', expectedId)

  if (settings && settings.length > 0) {
    console.log('   ✅ PASS: user_settings exists with correct user_id')
    allChecks.push(true)
  } else {
    console.log('   ❌ FAIL: user_settings not found or wrong user_id')
    allChecks.push(false)
  }

  // Check 7: Authentication test
  console.log('\n7️⃣  Testing Authentication...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: guestEmail,
    password: 'Guest123'
  })

  if (!authError && authData?.user?.id === expectedId) {
    console.log('   ✅ PASS: Authentication successful with correct ID')
    await supabase.auth.signOut()
    allChecks.push(true)
  } else {
    console.log('   ❌ FAIL: Authentication failed')
    console.log(`      Error: ${authError?.message || 'Unknown'}`)
    allChecks.push(false)
  }

  // Check 8: No old user records
  console.log('\n8️⃣  Checking for Duplicate Records...')
  const { data: allGuestUsers } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', guestEmail)

  if (allGuestUsers && allGuestUsers.length === 1) {
    console.log('   ✅ PASS: Only one user record exists (no duplicates)')
    allChecks.push(true)
  } else {
    console.log(`   ❌ FAIL: Found ${allGuestUsers?.length || 0} user records`)
    allChecks.push(false)
  }

  // Final Summary
  console.log('\n' + '='.repeat(60))
  console.log('VERIFICATION SUMMARY')
  console.log('='.repeat(60))

  const passed = allChecks.filter(c => c).length
  const total = allChecks.length

  console.log(`\n📊 Results: ${passed}/${total} checks passed`)

  if (passed === total) {
    console.log('\n🎉 ALL CHECKS PASSED! Fix is complete and verified.')
    console.log('\n✅ guest@guest.com authentication is working correctly')
    console.log('   Email: guest@guest.com')
    console.log('   Password: Guest123')
    console.log('   Role: Super User')
    console.log('   Tenant: ARTLEE')
  } else {
    console.log('\n⚠️  Some checks failed. Please review the issues above.')
  }

  console.log('\n' + '='.repeat(60))
}

verify().catch(console.error)
