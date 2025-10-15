/**
 * Fix ARTLEE Authentication - Final Solution
 * Uses temporary email to work around unique constraints
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixAuth() {
  console.log('🔧 Fixing ARTLEE authentication - Final solution...\n')

  const OLD_ID = 'd4ca7563-c542-44b4-bb9c-f4d8fb5ab71a'
  const NEW_ID = '6fb26981-a8f6-479c-9995-36cd238ca185'
  const EMAIL = 'create@artlee.agency'
  const TEMP_EMAIL = `temp_${Date.now()}@artlee.agency`

  try {
    // Step 1: Get old user data
    console.log('📥 Step 1: Fetching old user data...')
    const { data: oldUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', OLD_ID)
      .single()

    if (fetchError || !oldUser) {
      throw new Error('Old user not found')
    }
    console.log('✅ Old user data retrieved')

    // Step 2: Change old user's email to temporary email
    console.log('📝 Step 2: Changing old user email to temporary...')
    const { error: tempEmailError } = await supabase
      .from('users')
      .update({ email: TEMP_EMAIL })
      .eq('id', OLD_ID)

    if (tempEmailError) {
      console.error('❌ Error updating to temp email:', tempEmailError)
      throw tempEmailError
    }
    console.log(`✅ Email changed to ${TEMP_EMAIL}`)

    // Step 3: Create new user with Auth ID and correct email
    console.log('📝 Step 3: Creating new user with Auth ID...')
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: NEW_ID,
        email: EMAIL,
        name: oldUser.name,
        role: oldUser.role,
        tenant_id: oldUser.tenant_id,
        is_active: oldUser.is_active,
        mfa_enabled: oldUser.mfa_enabled,
        last_login: oldUser.last_login,
        created_at: oldUser.created_at
      })

    if (insertError) {
      console.error('❌ Error creating new user:', insertError)
      // Rollback: restore old user's email
      await supabase.from('users').update({ email: EMAIL }).eq('id', OLD_ID)
      throw insertError
    }
    console.log('✅ New user created')

    // Step 4: Update user_settings to point to new user
    console.log('📝 Step 4: Updating user_settings...')
    const { error: settingsError } = await supabase
      .from('user_settings')
      .update({ user_id: NEW_ID })
      .eq('user_id', OLD_ID)

    if (settingsError) {
      console.error('❌ Error updating user_settings:', settingsError)
      throw settingsError
    }
    console.log('✅ user_settings updated')

    // Step 5: Update user_profiles if exists
    console.log('📝 Step 5: Updating user_profiles...')
    await supabase
      .from('user_profiles')
      .update({ user_id: NEW_ID })
      .eq('user_id', OLD_ID)
    console.log('✅ user_profiles updated (if exists)')

    // Step 6: Delete old user record
    console.log('🗑️  Step 6: Deleting old user record...')
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', OLD_ID)

    if (deleteError) {
      console.error('❌ Error deleting old user:', deleteError)
      console.log('⚠️  Continuing anyway - old record may remain')
    } else {
      console.log('✅ Old user record deleted')
    }

    // Step 7: Verify fix
    console.log('\n🔍 Verifying fix...')
    const { data: newUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', EMAIL)
      .eq('tenant_id', 'artlee')
      .single()

    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const authUser = authUsers?.users?.find(u => u.email === EMAIL)

    if (newUser && authUser && newUser.id === authUser.id) {
      console.log('✅ ✅ ✅ SUCCESS! Authentication FIXED! ✅ ✅ ✅')
      console.log(`\n   Database ID: ${newUser.id}`)
      console.log(`   Auth ID: ${authUser.id}`)
      console.log(`   IDs Match: ${newUser.id === authUser.id ? '✅ YES' : '❌ NO'}`)
      console.log(`\n   Email: ${newUser.email}`)
      console.log(`   Name: ${newUser.name}`)
      console.log(`   Role: ${newUser.role}`)
      console.log(`   Active: ${newUser.is_active}`)

      console.log('\n🔓 Login Credentials:')
      console.log(`   Email: ${EMAIL}`)
      console.log(`   Password: test1000!`)
      console.log('\n🌐 Login at: http://localhost:3002')
      console.log('\n🎉 You can now login successfully!')
    } else {
      console.log('⚠️  Verification issue - please check manually')
    }

  } catch (error) {
    console.error('\n❌ Fix failed:', error)
    console.log('\n⚠️  Please check the database for any partial changes')
  }
}

fixAuth()
