/**
 * Fix Pierre User - Add to Supabase Auth
 * This script creates the Supabase Auth user for pierre@phaetonai.com
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixPierreAuth() {
  console.log('🔧 Fixing Pierre user authentication...\n')

  const EMAIL = 'pierre@phaetonai.com'
  const PASSWORD = 'Admin123!'
  const NAME = 'Pierre Morenzie'

  try {
    // Step 1: Check if user already exists in Supabase Auth
    console.log('1️⃣ Checking if user exists in Supabase Auth...')
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = existingAuthUsers?.users?.find(u => u.email === EMAIL)

    if (existingAuthUser) {
      console.log(`✅ User already exists in Supabase Auth (ID: ${existingAuthUser.id})`)
      console.log('   Updating password...')

      // Update password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        { password: PASSWORD }
      )

      if (updateError) {
        throw updateError
      }

      console.log('✅ Password updated successfully')
    } else {
      // Step 2: Create user in Supabase Auth
      console.log('2️⃣ Creating user in Supabase Auth...')
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: NAME
        }
      })

      if (authError) {
        throw authError
      }

      console.log(`✅ User created in Supabase Auth (ID: ${authData.user.id})`)
    }

    // Step 3: Check/create user in users table
    console.log('\n3️⃣ Checking users table...')
    const { data: existingUsers, error: selectError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', EMAIL)
      .eq('tenant_id', 'carexps')

    if (selectError) {
      console.error('Error checking users table:', selectError)
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log(`✅ User exists in users table (ID: ${existingUsers[0].id})`)

      // Update to ensure they're active and have super_user role
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          role: 'super_user',
          is_active: true,
          name: NAME
        })
        .eq('email', EMAIL)
        .eq('tenant_id', 'carexps')

      if (updateError) {
        console.error('Error updating user:', updateError)
      } else {
        console.log('✅ User updated with super_user role')
      }
    } else {
      console.log('4️⃣ Creating user in users table...')
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          email: EMAIL,
          name: NAME,
          role: 'super_user',
          is_active: true,
          tenant_id: 'carexps',
          mfa_enabled: false
        })

      if (insertError) {
        console.error('Error creating user in users table:', insertError)
      } else {
        console.log('✅ User created in users table')
      }
    }

    console.log('\n✅ COMPLETE! You can now login with:')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}`)
    console.log('\n🔄 Refresh your browser and try logging in')

  } catch (error) {
    console.error('\n❌ Error fixing Pierre user:', error.message)
    process.exit(1)
  }
}

fixPierreAuth()
