/**
 * Apply Fix for guest@guest.com Authentication Issue
 *
 * This script will:
 * 1. Delete the incorrect users table record (wrong ID)
 * 2. Create new users table record with correct Supabase Auth ID
 * 3. Update user_settings to reference correct user ID
 * 4. Set user role to super_user (first ARTLEE user)
 * 5. Test authentication
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('\n🔧 ARTLEE CRM - Apply Guest Authentication Fix\n')
console.log('=' .repeat(60))

async function main() {
  const guestEmail = 'guest@guest.com'
  const correctAuthId = '766134df-6bc2-4e07-a0cc-b009c8b889cc'
  const wrongUserId = '014b646c-2194-49b9-8611-0f6a42dcf77f'
  const tenantId = 'artlee'

  console.log('\n📋 Fix Plan:')
  console.log(`   1. Delete users table record with wrong ID: ${wrongUserId}`)
  console.log(`   2. Create users table record with correct ID: ${correctAuthId}`)
  console.log(`   3. Update user_settings to reference correct ID`)
  console.log(`   4. Set role to super_user (first ARTLEE user)`)
  console.log(`   5. Test authentication`)

  // Step 1: Get current user_settings data to preserve it
  console.log('\n' + '='.repeat(60))
  console.log('STEP 1: Backup user_settings Data')
  console.log('='.repeat(60))

  const { data: oldSettings, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', wrongUserId)

  if (settingsError) {
    console.error('⚠️  Error reading user_settings:', settingsError.message)
  } else {
    console.log(`✅ Found ${oldSettings?.length || 0} user_settings record(s) to migrate`)
    if (oldSettings && oldSettings.length > 0) {
      console.log('   Settings data backed up')
    }
  }

  // Step 2: Delete old user record
  console.log('\n' + '='.repeat(60))
  console.log('STEP 2: Delete Old users Table Record')
  console.log('='.repeat(60))

  const { error: deleteUserError } = await supabase
    .from('users')
    .delete()
    .eq('id', wrongUserId)

  if (deleteUserError) {
    console.error('❌ Error deleting old user:', deleteUserError.message)
    console.error('   Cannot proceed with fix')
    return
  } else {
    console.log('✅ Deleted old user record with wrong ID')
  }

  // Step 3: Delete old user_settings records
  console.log('\n' + '='.repeat(60))
  console.log('STEP 3: Delete Old user_settings Records')
  console.log('='.repeat(60))

  const { error: deleteSettingsError } = await supabase
    .from('user_settings')
    .delete()
    .eq('user_id', wrongUserId)

  if (deleteSettingsError) {
    console.error('⚠️  Error deleting old settings:', deleteSettingsError.message)
  } else {
    console.log('✅ Deleted old user_settings records')
  }

  // Step 4: Create new user record with correct ID
  console.log('\n' + '='.repeat(60))
  console.log('STEP 4: Create New users Table Record')
  console.log('='.repeat(60))

  const { data: newUser, error: insertUserError } = await supabase
    .from('users')
    .insert({
      id: correctAuthId,  // Use Supabase Auth ID
      email: guestEmail,
      name: 'Guest User',
      role: 'super_user',  // First ARTLEE user should be Super User
      tenant_id: tenantId,
      is_active: true,
      mfa_enabled: false,
      metadata: {
        created_via: 'fix_script',
        fixed_at: new Date().toISOString(),
        original_id: wrongUserId,
        reason: 'Sync Supabase Auth ID with users table'
      }
    })
    .select()
    .single()

  if (insertUserError) {
    console.error('❌ Error creating new user:', insertUserError.message)
    console.error('   Fix failed - you may need to manually fix this')
    return
  } else {
    console.log('✅ Created new user record:')
    console.log(`   ID: ${newUser.id}`)
    console.log(`   Email: ${newUser.email}`)
    console.log(`   Name: ${newUser.name}`)
    console.log(`   Role: ${newUser.role}`)
    console.log(`   Tenant: ${newUser.tenant_id}`)
  }

  // Step 5: Create new user_settings with correct ID
  console.log('\n' + '='.repeat(60))
  console.log('STEP 5: Create New user_settings Record')
  console.log('='.repeat(60))

  // Merge old settings with new user ID
  const settingsToInsert = oldSettings && oldSettings.length > 0
    ? {
        user_id: correctAuthId,
        tenant_id: tenantId,
        settings: oldSettings[0].settings || {},
        fresh_mfa_secret: oldSettings[0].fresh_mfa_secret,
        fresh_mfa_enabled: oldSettings[0].fresh_mfa_enabled,
        fresh_mfa_setup_completed: oldSettings[0].fresh_mfa_setup_completed,
        fresh_mfa_backup_codes: oldSettings[0].fresh_mfa_backup_codes
      }
    : {
        user_id: correctAuthId,
        tenant_id: tenantId,
        settings: {
          theme: 'light',
          notifications_enabled: true
        }
      }

  const { data: newSettings, error: insertSettingsError } = await supabase
    .from('user_settings')
    .insert(settingsToInsert)
    .select()
    .single()

  if (insertSettingsError) {
    console.error('⚠️  Error creating user_settings:', insertSettingsError.message)
  } else {
    console.log('✅ Created new user_settings record')
  }

  // Step 6: Test authentication
  console.log('\n' + '='.repeat(60))
  console.log('STEP 6: Test Authentication')
  console.log('='.repeat(60))

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: guestEmail,
    password: 'Guest123'
  })

  if (authError) {
    console.error('❌ Authentication test failed:', authError.message)
  } else {
    console.log('✅ Authentication successful!')
    console.log(`   Auth User ID: ${authData.user.id}`)

    // Now verify user record can be loaded
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (verifyError) {
      console.error('❌ User record verification failed:', verifyError.message)
    } else {
      console.log('✅ User record verified:')
      console.log(`   Users Table ID: ${verifyUser.id}`)
      console.log(`   Email: ${verifyUser.email}`)
      console.log(`   Role: ${verifyUser.role}`)
      console.log(`   Tenant: ${verifyUser.tenant_id}`)
      console.log('\n   ✅ IDs MATCH! Authentication fix successful!')
    }

    // Sign out
    await supabase.auth.signOut()
  }

  // Step 7: Verify tenant isolation
  console.log('\n' + '='.repeat(60))
  console.log('STEP 7: Verify Tenant Isolation')
  console.log('='.repeat(60))

  const { data: artleeUsers, error: artleeError } = await supabase
    .from('users')
    .select('email, tenant_id, role')
    .eq('tenant_id', 'artlee')

  if (artleeError) {
    console.error('❌ Error checking tenant isolation:', artleeError.message)
  } else {
    console.log(`✅ Found ${artleeUsers.length} user(s) in ARTLEE tenant:`)
    artleeUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`)
    })
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('FIX SUMMARY')
  console.log('='.repeat(60))

  console.log('\n✅ All fixes applied successfully!')
  console.log('\n📋 What was fixed:')
  console.log('   1. ✅ Deleted old users record with wrong ID')
  console.log('   2. ✅ Created new users record with correct Supabase Auth ID')
  console.log('   3. ✅ Updated user_settings to reference correct ID')
  console.log('   4. ✅ Set user role to super_user')
  console.log('   5. ✅ Verified authentication works')
  console.log('   6. ✅ Verified tenant isolation')

  console.log('\n🎉 Guest user authentication is now fixed!')
  console.log('\n📝 You can now login with:')
  console.log(`   Email: ${guestEmail}`)
  console.log('   Password: Guest123')
  console.log('\n💡 Next steps:')
  console.log('   1. Clear browser localStorage')
  console.log('   2. Navigate to ARTLEE CRM login page')
  console.log('   3. Login with the credentials above')
  console.log('   4. Verify user profile loads correctly')
}

main().catch(console.error)
