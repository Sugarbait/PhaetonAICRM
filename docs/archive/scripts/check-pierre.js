/**
 * Check for Pierre's account everywhere
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkPierre() {
  console.log('🔍 Checking for pierre@phaetonai.com...\n')

  const email = 'pierre@phaetonai.com'

  // 1. Check database users table
  console.log('1️⃣ Checking users table...')
  const { data: dbUsers, error: dbError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)

  if (dbError) {
    console.log('   ❌ Error:', dbError.message)
  } else if (dbUsers && dbUsers.length > 0) {
    console.log('   ⚠️  FOUND in database!')
    dbUsers.forEach(u => console.log(`      ID: ${u.id}, Tenant: ${u.tenant_id}, Role: ${u.role}`))
  } else {
    console.log('   ✅ NOT in database')
  }

  // 2. Check ALL Auth users
  console.log('\n2️⃣ Checking Supabase Auth...')
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

  if (authError) {
    console.log('   ❌ Error:', authError.message)
  } else {
    console.log(`   Total Auth users: ${authData.users.length}`)
    authData.users.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} - ID: ${u.id}`)
      if (u.email === email) {
        console.log('      ⚠️  THIS IS PIERRE!')
      }
    })
  }

  // 3. Check user_profiles
  console.log('\n3️⃣ Checking user_profiles table...')
  try {
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .limit(100)

    if (profileError) {
      console.log('   ❌ Error:', profileError.message)
    } else {
      console.log(`   Total profiles: ${profiles?.length || 0}`)
      if (profiles && profiles.length > 0) {
        profiles.forEach(p => {
          console.log(`      user_id: ${p.user_id}`)
        })
      }
    }
  } catch (err) {
    console.log('   ⚠️  Table may not exist')
  }

  // 4. Check user_settings
  console.log('\n4️⃣ Checking user_settings table...')
  try {
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('user_id')
      .limit(100)

    if (settingsError) {
      console.log('   ❌ Error:', settingsError.message)
    } else {
      console.log(`   Total settings: ${settings?.length || 0}`)
    }
  } catch (err) {
    console.log('   ⚠️  Table may not exist')
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY:')
  console.log('='.repeat(60))

  const pierreInDb = dbUsers && dbUsers.length > 0
  const pierreInAuth = authData?.users?.some(u => u.email === email)

  if (!pierreInDb && !pierreInAuth) {
    console.log('✅ pierre@phaetonai.com is COMPLETELY CLEAR')
    console.log('✅ You should be able to register now!')
  } else {
    console.log('⚠️  pierre@phaetonai.com still exists:')
    if (pierreInDb) console.log('   - In database (users table)')
    if (pierreInAuth) console.log('   - In Supabase Auth')
  }
}

checkPierre()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
