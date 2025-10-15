/**
 * Clear All Users - Complete Reset
 * This script deletes ALL users from Supabase Auth and database
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function clearAllUsers() {
  console.log('🗑️  Clearing ALL users from Supabase...\n')

  try {
    // Step 1: Delete ALL users from users table (carexps tenant)
    console.log('1️⃣ Deleting all users from users table...')
    const { error: deleteUsersError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('tenant_id', 'carexps')

    if (deleteUsersError) {
      console.error('Error deleting from users table:', deleteUsersError)
    } else {
      console.log('✅ All users deleted from users table')
    }

    // Step 2: Delete ALL users from Supabase Auth
    console.log('\n2️⃣ Deleting all users from Supabase Auth...')
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()

    if (authUsers && authUsers.users && authUsers.users.length > 0) {
      for (const user of authUsers.users) {
        console.log(`   Deleting: ${user.email} (${user.id})`)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        if (error) {
          console.error(`   ❌ Error deleting ${user.email}:`, error.message)
        } else {
          console.log(`   ✅ Deleted ${user.email}`)
        }
      }
    } else {
      console.log('   No Auth users to delete')
    }

    // Step 3: Delete user_settings
    console.log('\n3️⃣ Deleting all user settings...')
    const { error: deleteSettingsError } = await supabaseAdmin
      .from('user_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteSettingsError) {
      console.error('Error deleting user settings:', deleteSettingsError)
    } else {
      console.log('✅ All user settings deleted')
    }

    console.log('\n✅ DATABASE CLEARED!')
    console.log('\n📋 Next steps:')
    console.log('   1. Clear browser localStorage:')
    console.log('      - Open browser console (F12)')
    console.log('      - Run: localStorage.clear()')
    console.log('      - Run: sessionStorage.clear()')
    console.log('   2. Refresh the page (Ctrl+Shift+R)')
    console.log('   3. Click "Create New Profile" to register as first user')
    console.log('   4. First user automatically gets Super User role')

  } catch (error) {
    console.error('\n❌ Error clearing users:', error.message)
    process.exit(1)
  }
}

clearAllUsers()
