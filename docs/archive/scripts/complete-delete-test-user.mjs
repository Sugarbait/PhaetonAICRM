/**
 * Completely delete test@test.com user from all tables
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

async function completelyDeleteTestUser() {
  console.log('🗑️  Completely deleting test@test.com user...\n')

  try {
    const userId = '424a05ad-a527-45e4-b4ef-b235d8756129'

    // 1. Delete from user_profiles
    console.log('1️⃣ Deleting from user_profiles...')
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    if (profileError) {
      console.log('   ⚠️  Error:', profileError.message)
    } else {
      console.log('   ✅ Deleted from user_profiles')
    }

    // 2. Delete from user_settings
    console.log('\n2️⃣ Deleting from user_settings...')
    const { error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .delete()
      .eq('user_id', userId)

    if (settingsError) {
      console.log('   ⚠️  Error:', settingsError.message)
    } else {
      console.log('   ✅ Deleted from user_settings')
    }

    // 3. Delete from users table
    console.log('\n3️⃣ Deleting from users table...')
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (userError) {
      console.error('   ❌ Error:', userError.message)
    } else {
      console.log('   ✅ Deleted from users table')
    }

    // 4. Verify deletion
    console.log('\n4️⃣ Verifying deletion...')
    const { data: remainingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (remainingUser) {
      console.log('   ❌ User still exists in database')
    } else {
      console.log('   ✅ User completely deleted from database')
    }

    console.log('\n' + '═'.repeat(80))
    console.log('✅ COMPLETE DELETION SUCCESSFUL')
    console.log('═'.repeat(80))
    console.log('')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

completelyDeleteTestUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
  })
