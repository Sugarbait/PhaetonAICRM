/**
 * Phaeton AI CRM - Login Diagnosis and Fix Script
 *
 * This script diagnoses authentication issues and fixes login problems
 * for newly created users in the Phaeton AI CRM application.
 *
 * Run with: node diagnose-and-fix-login.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import * as readline from 'readline'

// Load environment variables
dotenv.config({ path: '.env.local' })

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve))

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const TENANT_ID = 'phaeton_ai'

console.log('\n🔍 Phaeton AI CRM - Login Diagnosis & Fix Tool\n')
console.log('=' .repeat(60))

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ ERROR: Missing Supabase credentials in .env.local')
  console.error('Required variables:')
  console.error('  - VITE_SUPABASE_URL')
  console.error('  - VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log(`\n✅ Supabase URL: ${SUPABASE_URL}`)
console.log(`✅ Tenant ID: ${TENANT_ID}`)

// Create Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Main diagnostic function
 */
async function diagnoseLogin() {
  try {
    console.log('\n📋 Step 1: Checking Database Schema\n')

    // Check if users table exists
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)

    if (tablesError) {
      console.error('❌ ERROR: Cannot access users table:', tablesError.message)
      console.error('\nPossible issues:')
      console.error('  - Users table does not exist')
      console.error('  - RLS policies blocking access (even with service role)')
      console.error('  - Database connection issues')
      return false
    }

    console.log('✅ Users table exists and is accessible')

    // Get all users for this tenant
    console.log(`\n📋 Step 2: Checking Users in Database (tenant: ${TENANT_ID})\n`)

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, is_active, created_at, tenant_id')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('❌ ERROR: Failed to fetch users:', usersError.message)
      return false
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users found in database for tenant:', TENANT_ID)
      console.log('\nThis means:')
      console.log('  - User registration might have failed')
      console.log('  - User was deleted from database')
      console.log('  - Wrong tenant_id was used during registration')

      const createUser = await question('\n❓ Would you like to create a test user? (yes/no): ')
      if (createUser.toLowerCase() === 'yes') {
        await createTestUser()
      }
      return false
    }

    console.log(`✅ Found ${users.length} user(s) in database:\n`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.name || 'Not set'}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`)
      console.log(`   Tenant: ${user.tenant_id}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}\n`)
    })

    // Check Supabase Auth users
    console.log('📋 Step 3: Checking Supabase Auth Users\n')

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('❌ ERROR: Failed to fetch auth users:', authError.message)
      return false
    }

    const authUsers = authData?.users || []
    console.log(`✅ Found ${authUsers.length} user(s) in Supabase Auth:\n`)

    authUsers.forEach((authUser, index) => {
      console.log(`${index + 1}. ${authUser.email}`)
      console.log(`   ID: ${authUser.id}`)
      console.log(`   Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`   Created: ${new Date(authUser.created_at).toLocaleString()}\n`)
    })

    // Cross-reference users
    console.log('📋 Step 4: Cross-Referencing Database and Auth Users\n')

    const dbEmails = users.map(u => u.email.toLowerCase())
    const authEmails = authUsers.map(u => u.email?.toLowerCase())

    const inDbNotInAuth = users.filter(u => !authEmails.includes(u.email.toLowerCase()))
    const inAuthNotInDb = authUsers.filter(u => !dbEmails.includes(u.email?.toLowerCase() || ''))

    if (inDbNotInAuth.length > 0) {
      console.log('⚠️  Users in DATABASE but NOT in AUTH (cannot use Supabase Auth):')
      inDbNotInAuth.forEach(u => console.log(`   - ${u.email}`))
      console.log('\n   These users can only use local credentials (if configured)\n')
    }

    if (inAuthNotInDb.length > 0) {
      console.log('⚠️  Users in AUTH but NOT in DATABASE (incomplete registration):')
      inAuthNotInDb.forEach(u => console.log(`   - ${u.email}`))
      console.log('\n   These users cannot log in - registration incomplete\n')
    }

    if (inDbNotInAuth.length === 0 && inAuthNotInDb.length === 0) {
      console.log('✅ All users are properly synchronized between Auth and Database')
    }

    // Check user credentials storage
    console.log('\n📋 Step 5: Checking User Credentials Storage\n')

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, encrypted_retell_api_key')

    if (profilesError && !profilesError.message.includes('does not exist')) {
      console.error('⚠️  Could not check user_profiles table:', profilesError.message)
    } else if (profiles) {
      const usersWithCredentials = profiles.filter(p => p.encrypted_retell_api_key)
      console.log(`✅ ${usersWithCredentials.length} user(s) have encrypted credentials stored`)

      const dbUserIds = users.map(u => u.id)
      const usersWithoutCredentials = dbUserIds.filter(id =>
        !profiles.find(p => p.user_id === id && p.encrypted_retell_api_key)
      )

      if (usersWithoutCredentials.length > 0) {
        console.log(`\n⚠️  ${usersWithoutCredentials.length} user(s) missing credentials:`)
        usersWithoutCredentials.forEach(id => {
          const user = users.find(u => u.id === id)
          console.log(`   - ${user?.email || id}`)
        })
      }
    }

    // Check RLS policies
    console.log('\n📋 Step 6: Checking Row Level Security (RLS) Policies\n')

    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
              FROM pg_policies
              WHERE tablename IN ('users', 'user_settings', 'user_profiles')
              ORDER BY tablename, policyname`
      })
      .catch(() => ({ data: null, error: { message: 'RPC function not available' } }))

    if (policiesError) {
      console.log('⚠️  Could not check RLS policies:', policiesError.message)
      console.log('   (This is normal if exec_sql RPC is not configured)')
    }

    return true
  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message)
    return false
  }
}

/**
 * Create a test user for diagnosis
 */
async function createTestUser() {
  try {
    const email = await question('\nEnter email for test user: ')
    const password = await question('Enter password: ')
    const name = await question('Enter full name: ')

    console.log('\n🔨 Creating test user...\n')

    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        tenant_id: TENANT_ID
      }
    })

    if (authError) {
      console.error('❌ Failed to create auth user:', authError.message)
      return
    }

    console.log('✅ Created user in Supabase Auth')

    // Step 2: Create user in database
    const userId = authData.user.id

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        role: 'super_user', // First user gets super_user role
        is_active: true,
        tenant_id: TENANT_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('❌ Failed to create database user:', dbError.message)
      console.log('\n⚠️  User created in Auth but not in Database!')
      console.log('   Attempting to delete auth user...')

      await supabaseAdmin.auth.admin.deleteUser(userId)
      console.log('✅ Cleaned up incomplete auth user')
      return
    }

    console.log('✅ Created user in database')

    // Step 3: Create user settings
    const { error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .insert({
        user_id: userId,
        tenant_id: TENANT_ID,
        theme: 'dark',
        created_at: new Date().toISOString()
      })

    if (settingsError && !settingsError.message.includes('duplicate key')) {
      console.warn('⚠️  Could not create user settings:', settingsError.message)
    } else {
      console.log('✅ Created user settings')
    }

    console.log('\n✨ Test user created successfully!')
    console.log(`\nYou can now log in with:`)
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)

  } catch (error) {
    console.error('\n❌ Failed to create test user:', error.message)
  }
}

/**
 * Fix an existing user
 */
async function fixUser(email) {
  try {
    console.log(`\n🔧 Attempting to fix user: ${email}\n`)

    // Check if user exists in database
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('tenant_id', TENANT_ID)
      .single()

    if (dbError || !dbUser) {
      console.log('❌ User not found in database')

      // Check if user exists in Auth
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
      const authUser = authData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

      if (authUser) {
        console.log('✅ User found in Auth, creating database record...')

        const name = await question('Enter full name for this user: ')
        const role = await question('Enter role (user/super_user): ')

        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authUser.id,
            email,
            name,
            role: role || 'user',
            is_active: true,
            tenant_id: TENANT_ID,
            created_at: authUser.created_at,
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('❌ Failed to create database record:', insertError.message)
          return
        }

        console.log('✅ Database record created')
      } else {
        console.log('❌ User not found in Auth either')

        const create = await question('\nCreate this user? (yes/no): ')
        if (create.toLowerCase() === 'yes') {
          const password = await question('Enter password: ')
          const name = await question('Enter full name: ')

          // Create in Auth
          const { data: newAuthData, error: newAuthError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
          })

          if (newAuthError) {
            console.error('❌ Failed to create auth user:', newAuthError.message)
            return
          }

          // Create in database
          const { error: newDbError } = await supabaseAdmin
            .from('users')
            .insert({
              id: newAuthData.user.id,
              email,
              name,
              role: 'super_user',
              is_active: true,
              tenant_id: TENANT_ID
            })

          if (newDbError) {
            console.error('❌ Failed to create database record:', newDbError.message)
            await supabaseAdmin.auth.admin.deleteUser(newAuthData.user.id)
            return
          }

          console.log('✅ User created successfully')
        }
        return
      }
    }

    // Activate user if inactive
    if (!dbUser.is_active) {
      console.log('⚠️  User is inactive, activating...')

      const { error: activateError } = await supabaseAdmin
        .from('users')
        .update({ is_active: true })
        .eq('id', dbUser.id)

      if (activateError) {
        console.error('❌ Failed to activate user:', activateError.message)
      } else {
        console.log('✅ User activated')
      }
    }

    // Check Auth user
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!authUser) {
      console.log('⚠️  User not found in Auth')
      console.log('   User can only log in with local credentials (if configured)')
    } else {
      console.log('✅ User exists in Auth')
    }

    console.log('\n✅ User fix completed')

  } catch (error) {
    console.error('\n❌ Failed to fix user:', error.message)
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const success = await diagnoseLogin()

    if (!success) {
      console.log('\n' + '='.repeat(60))
      rl.close()
      return
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n💡 Options:')
    console.log('  1. Fix a specific user')
    console.log('  2. Create a new test user')
    console.log('  3. Exit')

    const choice = await question('\nEnter your choice (1-3): ')

    switch (choice) {
      case '1':
        const email = await question('\nEnter user email to fix: ')
        await fixUser(email)
        break
      case '2':
        await createTestUser()
        break
      case '3':
        console.log('\n👋 Goodbye!')
        break
      default:
        console.log('\n❌ Invalid choice')
    }

    rl.close()
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    rl.close()
    process.exit(1)
  }
}

main()
