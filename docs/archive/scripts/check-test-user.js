/**
 * Diagnostic Tool: Check Test User
 * Checks if a test user exists in both database and Supabase Auth
 * Usage: node check-test-user.js
 */

import { createClient } from '@supabase/supabase-js'

// Phaeton AI CRM Supabase credentials
const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDAyOTUsImV4cCI6MjA2MjQ3NjI5NX0.IfkIVsp3AtLOyXDW9hq9bEvnozd9IaaUay244iDhWGE'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function checkTestUser() {
  console.log('🔍 Checking for test user...\n')

  const testEmail = 'test@test.com'
  const tenantId = 'phaeton_ai'

  // 1. Check database
  console.log('📊 DATABASE CHECK:')
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .eq('tenant_id', tenantId)

    if (error) {
      console.log('❌ Database error:', error.message)
    } else if (users && users.length > 0) {
      console.log('✅ User found in database:')
      users.forEach(user => {
        console.log(`   - ID: ${user.id}`)
        console.log(`   - Email: ${user.email}`)
        console.log(`   - Name: ${user.name}`)
        console.log(`   - Role: ${user.role}`)
        console.log(`   - Active: ${user.is_active}`)
        console.log(`   - Tenant: ${user.tenant_id}`)
      })
    } else {
      console.log('⚪ No user found in database')
    }
  } catch (err) {
    console.log('❌ Error checking database:', err.message)
  }

  console.log('\n📊 TENANT USER COUNT:')
  try {
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('id, email, role, tenant_id')
      .eq('tenant_id', tenantId)

    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log(`Total users for tenant '${tenantId}': ${allUsers?.length || 0}`)
      if (allUsers && allUsers.length > 0) {
        console.log('\nAll users:')
        allUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.role})`)
        })
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message)
  }

  console.log('\n🔐 SUPABASE AUTH CHECK:')
  console.log('⚠️  Manual check required:')
  console.log('   1. Go to Supabase Dashboard → Authentication → Users')
  console.log(`   2. Search for: ${testEmail}`)
  console.log('   3. If user exists in Auth but not database, delete from Auth')

  console.log('\n💡 UUID DEFAULT CHECK:')
  console.log('Run this SQL in Supabase SQL Editor:')
  console.log(`
    SELECT column_default
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'id';
  `)
  console.log('Expected result: gen_random_uuid()')
}

checkTestUser()
  .then(() => {
    console.log('\n✅ Diagnostic check complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Diagnostic failed:', err)
    process.exit(1)
  })
