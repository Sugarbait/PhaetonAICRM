/**
 * Delete ALL profiles - complete fresh start
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function deleteAllProfiles() {
  console.log('🗑️  Deleting ALL profiles - Fresh start\n')

  try {
    // 1. Get all users from phaeton_ai tenant
    console.log('1️⃣ Looking for all users...')
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('tenant_id', 'phaeton_ai')

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
    } else if (!users || users.length === 0) {
      console.log('✅ No users found in database')
    } else {
      console.log(`Found ${users.length} user(s):`)
      users.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} - ${u.name}`)
      })

      // Delete each user from database
      console.log('\n2️⃣ Deleting users from database...')
      for (const user of users) {
        const { error: deleteError } = await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', user.id)
          .eq('tenant_id', 'phaeton_ai')

        if (deleteError) {
          console.log(`   ❌ Failed to delete ${user.email}:`, deleteError.message)
        } else {
          console.log(`   ✅ Deleted ${user.email} from database`)
        }
      }
    }

    // 3. Get all Auth users
    console.log('\n3️⃣ Deleting Supabase Auth users...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error listing Auth users:', authError.message)
    } else if (!authData || !authData.users || authData.users.length === 0) {
      console.log('✅ No Auth users found')
    } else {
      console.log(`Found ${authData.users.length} Auth user(s)`)
      for (const authUser of authData.users) {
        try {
          const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id)
          if (deleteAuthError) {
            console.log(`   ⚠️  Failed to delete ${authUser.email}:`, deleteAuthError.message)
          } else {
            console.log(`   ✅ Deleted ${authUser.email} from Auth`)
          }
        } catch (err) {
          console.log(`   ⚠️  Error deleting ${authUser.email}:`, err.message)
        }
      }
    }

    // 4. Delete all user_profiles
    console.log('\n4️⃣ Clearing user_profiles table...')
    const { error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (profilesError) {
      console.log('⚠️  Error clearing user_profiles:', profilesError.message)
    } else {
      console.log('✅ Cleared user_profiles table')
    }

    // 5. Delete all user_settings
    console.log('\n5️⃣ Clearing user_settings table...')
    const { error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (settingsError) {
      console.log('⚠️  Error clearing user_settings:', settingsError.message)
    } else {
      console.log('✅ Cleared user_settings table')
    }

    // 6. Clear failed login attempts
    console.log('\n6️⃣ Clearing failed login attempts...')
    try {
      const { error: attemptsError } = await supabaseAdmin
        .from('failed_login_attempts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (attemptsError) {
        console.log('⚠️  Error clearing failed_login_attempts:', attemptsError.message)
      } else {
        console.log('✅ Cleared failed_login_attempts table')
      }
    } catch (err) {
      console.log('⚠️  failed_login_attempts table may not exist (OK)')
    }

    // 7. Verify deletion
    console.log('\n7️⃣ Verifying deletion...')
    const { data: remainingUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('tenant_id', 'phaeton_ai')

    const { data: remainingAuth } = await supabaseAdmin.auth.admin.listUsers()

    console.log(`   Database users: ${remainingUsers?.length || 0}`)
    console.log(`   Auth users: ${remainingAuth?.users?.length || 0}`)

    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL PROFILES DELETED - FRESH START READY')
    console.log('='.repeat(60))
    console.log('\n💡 Next steps:')
    console.log('   1. Clear browser localStorage (or use the HTML tool)')
    console.log('   2. Go to http://localhost:3000')
    console.log('   3. Register with pierre@phaetonai.com')
    console.log('   4. You will be the first user (automatic Super User)')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  }
}

deleteAllProfiles()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
  })
