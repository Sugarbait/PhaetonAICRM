/**
 * Verify complete deletion of test@test.com user
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function verifyUserDeletion() {
  console.log('🔍 Checking if test@test.com is completely deleted...\n')

  try {
    // Check users table
    console.log('1️⃣ Checking users table...')
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'test@test.com')
      .eq('tenant_id', 'phaeton_ai')
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      console.error('   ❌ Error:', userError.message)
    } else if (user) {
      console.log('   ⚠️  User STILL EXISTS in users table')
      console.log('      ID:', user.id)
      console.log('      Email:', user.email)
      console.log('      Role:', user.role)
      console.log('      Is Active:', user.is_active)
    } else {
      console.log('   ✅ User NOT found in users table (deleted)')
    }

    // Check user_profiles table
    console.log('\n2️⃣ Checking user_profiles table...')
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', 'test@test.com')

    if (profilesError && profilesError.code !== 'PGRST116') {
      console.error('   ❌ Error:', profilesError.message)
    } else if (profiles && profiles.length > 0) {
      console.log(`   ⚠️  Found ${profiles.length} profile(s) in user_profiles table`)
      profiles.forEach(p => {
        console.log('      Profile ID:', p.id)
        console.log('      User ID:', p.user_id)
      })
    } else {
      console.log('   ✅ No profiles found in user_profiles table (deleted)')
    }

    // Check user_settings table
    console.log('\n3️⃣ Checking user_settings table...')
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .ilike('email', 'test@test.com')

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('   ❌ Error:', settingsError.message)
    } else if (settings && settings.length > 0) {
      console.log(`   ⚠️  Found ${settings.length} setting(s) in user_settings table`)
      settings.forEach(s => {
        console.log('      Settings ID:', s.id)
        console.log('      User ID:', s.user_id)
      })
    } else {
      console.log('   ✅ No settings found in user_settings table (deleted)')
    }

    // Check Supabase Auth
    console.log('\n4️⃣ Checking Supabase Auth users...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('   ❌ Error:', authError.message)
    } else {
      const testAuthUser = authData.users.find(u => u.email === 'test@test.com')
      if (testAuthUser) {
        console.log('   ⚠️  User STILL EXISTS in Supabase Auth')
        console.log('      Auth ID:', testAuthUser.id)
        console.log('      Email:', testAuthUser.email)
      } else {
        console.log('   ✅ User NOT found in Supabase Auth (deleted)')
      }
    }

    console.log('\n' + '═'.repeat(80))
    console.log('📊 DELETION VERIFICATION SUMMARY')
    console.log('═'.repeat(80))

    const stillExists = !!(user || (profiles && profiles.length > 0) || (settings && settings.length > 0))

    if (stillExists) {
      console.log('⚠️  USER NOT COMPLETELY DELETED - Found remnants in database')
      console.log('\n💡 To completely delete, I can create a cleanup script.')
    } else {
      console.log('✅ USER COMPLETELY DELETED - No traces found in database')
    }
    console.log('')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

verifyUserDeletion()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
  })
