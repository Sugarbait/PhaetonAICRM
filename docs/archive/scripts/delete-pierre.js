/**
 * Delete Pierre User
 * Removes pierre@phaetonai.com from Supabase Auth and database
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

async function deletePierre() {
  console.log('🗑️  Deleting pierre@phaetonai.com...\n')

  const EMAIL = 'pierre@phaetonai.com'

  try {
    // Step 1: Find and delete from Supabase Auth
    console.log('1️⃣ Finding user in Supabase Auth...')
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const pierreAuth = authUsers?.users?.find(u => u.email === EMAIL)

    if (pierreAuth) {
      console.log(`   Found: ${pierreAuth.email} (${pierreAuth.id})`)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(pierreAuth.id)
      if (error) {
        console.error('   ❌ Error deleting from Auth:', error.message)
      } else {
        console.log('   ✅ Deleted from Supabase Auth')
      }
    } else {
      console.log('   ℹ️  Not found in Supabase Auth')
    }

    // Step 2: Delete from users table (all tenants)
    console.log('\n2️⃣ Deleting from users table...')
    const { error: deleteUsersError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('email', EMAIL)

    if (deleteUsersError) {
      console.error('   ❌ Error deleting from users table:', deleteUsersError)
    } else {
      console.log('   ✅ Deleted from users table')
    }

    // Step 3: Delete user settings
    console.log('\n3️⃣ Deleting user settings...')

    // First get the user_id from the deleted user
    if (pierreAuth) {
      const { error: deleteSettingsError } = await supabaseAdmin
        .from('user_settings')
        .delete()
        .eq('user_id', pierreAuth.id)

      if (deleteSettingsError) {
        console.error('   ❌ Error deleting user settings:', deleteSettingsError)
      } else {
        console.log('   ✅ Deleted user settings')
      }
    }

    console.log('\n✅ PIERRE USER DELETED!')
    console.log('\n📋 Next steps:')
    console.log('   1. In browser console at http://localhost:3004/, run:')
    console.log('      localStorage.clear()')
    console.log('      sessionStorage.clear()')
    console.log('      location.reload()')
    console.log('   2. Blue banner should appear!')
    console.log('   3. Register as a new user')

  } catch (error) {
    console.error('\n❌ Error deleting user:', error.message)
    process.exit(1)
  }
}

deletePierre()
