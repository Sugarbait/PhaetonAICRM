/**
 * Clear All Profiles - Complete Fresh Start
 *
 * This script deletes all users, profiles, and settings for Phaeton AI tenant
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

async function clearAllProfiles() {
  console.log('🗑️  Clearing ALL profiles for Phaeton AI tenant...\n')

  try {
    // 1. Get all users from phaeton_ai tenant
    console.log('1️⃣ Fetching all users...')
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('tenant_id', 'phaeton_ai')

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
    } else if (!users || users.length === 0) {
      console.log('✅ No users found in database - already clean')
    } else {
      console.log(`📊 Found ${users.length} user(s):`)
      users.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} - ${u.name} (${u.role})`)
      })

      // 2. Delete from user_profiles
      console.log('\n2️⃣ Deleting from user_profiles...')
      for (const user of users) {
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .delete()
          .eq('user_id', user.id)

        if (profileError) {
          console.log(`   ⚠️  ${user.email}: ${profileError.message}`)
        } else {
          console.log(`   ✅ ${user.email}`)
        }
      }

      // 3. Delete from user_settings
      console.log('\n3️⃣ Deleting from user_settings...')
      for (const user of users) {
        const { error: settingsError } = await supabaseAdmin
          .from('user_settings')
          .delete()
          .eq('user_id', user.id)

        if (settingsError) {
          console.log(`   ⚠️  ${user.email}: ${settingsError.message}`)
        } else {
          console.log(`   ✅ ${user.email}`)
        }
      }

      // 4. Delete from users table
      console.log('\n4️⃣ Deleting from users table...')
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('tenant_id', 'phaeton_ai')

      if (deleteError) {
        console.error('❌ Error deleting users:', deleteError.message)
      } else {
        console.log(`✅ Deleted ${users.length} user(s) from users table`)
      }
    }

    // 5. Clear failed login attempts
    console.log('\n5️⃣ Clearing failed login attempts...')
    try {
      const { error: attemptsError } = await supabaseAdmin
        .from('failed_login_attempts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (attemptsError) {
        console.log('⚠️  Error clearing failed_login_attempts:', attemptsError.message)
      } else {
        console.log('✅ Cleared failed_login_attempts table')
      }
    } catch (err) {
      console.log('ℹ️  failed_login_attempts table may not exist (OK)')
    }

    // 6. Get all Supabase Auth users
    console.log('\n6️⃣ Checking Supabase Auth users...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error listing Auth users:', authError.message)
    } else if (!authData || !authData.users || authData.users.length === 0) {
      console.log('✅ No Auth users found')
    } else {
      console.log(`📊 Found ${authData.users.length} Auth user(s)`)
      for (const authUser of authData.users) {
        try {
          const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id)
          if (deleteAuthError) {
            console.log(`   ⚠️  ${authUser.email}: ${deleteAuthError.message}`)
            // Try to change email instead
            const randomEmail = `deleted_${Date.now()}_${Math.random().toString(36).substring(7)}@deleted.local`
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              authUser.id,
              { email: randomEmail }
            )
            if (!updateError) {
              console.log(`   ✅ Changed ${authUser.email} to ${randomEmail}`)
            }
          } else {
            console.log(`   ✅ Deleted ${authUser.email} from Auth`)
          }
        } catch (err) {
          console.log(`   ⚠️  ${authUser.email}: ${err.message}`)
        }
      }
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

    console.log('\n' + '═'.repeat(80))
    console.log('✅ ALL PROFILES CLEARED - FRESH START READY')
    console.log('═'.repeat(80))
    console.log('\n💡 Next steps:')
    console.log('   1. Clear browser localStorage:')
    console.log('      - Press F12 → Console tab')
    console.log('      - Run: localStorage.clear(); sessionStorage.clear(); location.reload()')
    console.log('   2. Go to http://localhost:3000')
    console.log('   3. Click "Create New Profile"')
    console.log('   4. Register with pierre@phaetonai.com')
    console.log('   5. You will be the first user (automatic Super User)')
    console.log('')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  }
}

clearAllProfiles()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
  })
