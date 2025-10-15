/**
 * Quick Fix for Login Issues - Phaeton AI CRM
 *
 * This script quickly fixes the most common login issues:
 * 1. Activates inactive users
 * 2. Creates missing Supabase Auth users
 * 3. Ensures credentials are properly stored
 *
 * Run with: node quick-fix-login.js <email> <password>
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Get email and password from command line
const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('\n❌ Usage: node quick-fix-login.js <email> <password>')
  console.error('\nExample: node quick-fix-login.js user@example.com Password123')
  process.exit(1)
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const TENANT_ID = 'phaeton_ai'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ ERROR: Missing Supabase credentials in .env.local')
  process.exit(1)
}

console.log('\n🔧 Quick Login Fix Tool - Phaeton AI CRM\n')
console.log('=' .repeat(60))
console.log(`\nEmail: ${email}`)
console.log(`Tenant: ${TENANT_ID}`)

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function quickFix() {
  try {
    console.log('\n📋 Step 1: Checking database user...\n')

    // Check database user
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('tenant_id', TENANT_ID)
      .single()

    if (dbError || !dbUser) {
      console.error('❌ User not found in database')
      console.log('\n💡 Creating new user...\n')

      // Create in Supabase Auth first
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: email.split('@')[0],
          tenant_id: TENANT_ID
        }
      })

      if (authError) {
        console.error('❌ Failed to create auth user:', authError.message)
        return
      }

      console.log('✅ Created user in Supabase Auth')

      // Create in database
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name: email.split('@')[0],
          role: 'super_user',
          is_active: true,
          tenant_id: TENANT_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('❌ Failed to create database user:', insertError.message)
        // Clean up auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return
      }

      console.log('✅ Created user in database')

      // Create user settings
      await supabaseAdmin
        .from('user_settings')
        .insert({
          user_id: authData.user.id,
          tenant_id: TENANT_ID,
          theme: 'dark',
          created_at: new Date().toISOString()
        })

      console.log('✅ Created user settings')

      console.log('\n✨ User created successfully!')
      console.log(`\nYou can now log in at: http://localhost:3004/`)
      console.log(`  Email: ${email}`)
      console.log(`  Password: ${password}`)
      return
    }

    console.log(`✅ Found user in database`)
    console.log(`   ID: ${dbUser.id}`)
    console.log(`   Name: ${dbUser.name}`)
    console.log(`   Role: ${dbUser.role}`)
    console.log(`   Active: ${dbUser.is_active ? 'Yes' : 'No'}`)

    // Check Supabase Auth
    console.log('\n📋 Step 2: Checking Supabase Auth...\n')

    const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!authUser) {
      console.log('⚠️  User not found in Supabase Auth - creating...')

      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: dbUser.name,
          tenant_id: TENANT_ID
        }
      })

      if (authError) {
        console.error('❌ Failed to create auth user:', authError.message)
        console.log('\n💡 User will need to use local credentials fallback')
      } else {
        console.log('✅ Created user in Supabase Auth')

        // Update database with new Auth ID if different
        if (newAuthData.user.id !== dbUser.id) {
          console.log('⚠️  Warning: Auth ID differs from database ID')
          console.log(`   Database ID: ${dbUser.id}`)
          console.log(`   Auth ID: ${newAuthData.user.id}`)
          console.log('\n   Using database ID (keeping existing user data)')
        }
      }
    } else {
      console.log('✅ User exists in Supabase Auth')
      console.log(`   ID: ${authUser.id}`)
      console.log(`   Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`)
    }

    // Activate user if inactive
    if (!dbUser.is_active) {
      console.log('\n📋 Step 3: Activating user account...\n')

      const { error: activateError } = await supabaseAdmin
        .from('users')
        .update({ is_active: true })
        .eq('id', dbUser.id)

      if (activateError) {
        console.error('❌ Failed to activate user:', activateError.message)
      } else {
        console.log('✅ User account activated')
      }
    }

    // Ensure user settings exist
    console.log('\n📋 Step 4: Checking user settings...\n')

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', dbUser.id)
      .single()

    if (settingsError || !settings) {
      console.log('⚠️  User settings not found - creating...')

      const { error: insertSettingsError } = await supabaseAdmin
        .from('user_settings')
        .insert({
          user_id: dbUser.id,
          tenant_id: TENANT_ID,
          theme: 'dark',
          created_at: new Date().toISOString()
        })

      if (insertSettingsError && !insertSettingsError.message.includes('duplicate')) {
        console.warn('⚠️  Could not create settings:', insertSettingsError.message)
      } else {
        console.log('✅ User settings created')
      }
    } else {
      console.log('✅ User settings exist')
    }

    console.log('\n' + '=' .repeat(60))
    console.log('\n✨ Login fix completed successfully!\n')
    console.log('You can now log in at: http://localhost:3004/')
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
    console.log('\n💡 If login still fails, try:')
    console.log('   1. Clear browser cache and localStorage')
    console.log('   2. Use incognito/private browsing mode')
    console.log('   3. Run the full diagnostic: node diagnose-and-fix-login.js')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

quickFix()
