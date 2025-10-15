/**
 * Migrate ARTLEE User to New ID
 * Creates new user record with Auth ID, migrates data, deletes old record
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

async function migrateUserId() {
  console.log('🔄 Migrating ARTLEE user to new ID...\n')

  const OLD_ID = 'd4ca7563-c542-44b4-bb9c-f4d8fb5ab71a'
  const NEW_ID = '6fb26981-a8f6-479c-9995-36cd238ca185'
  const EMAIL = 'create@artlee.agency'

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

    // Step 2: Create new user with Auth ID
    console.log('📝 Step 2: Creating new user record with Auth ID...')
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: NEW_ID,
        email: oldUser.email,
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
      throw insertError
    }
    console.log('✅ New user created with Auth ID')

    // Step 3: Update user_settings to point to new user
    console.log('📝 Step 3: Updating user_settings...')
    const { error: settingsError } = await supabase
      .from('user_settings')
      .update({ user_id: NEW_ID })
      .eq('user_id', OLD_ID)

    if (settingsError) {
      console.error('❌ Error updating user_settings:', settingsError)
      throw settingsError
    }
    console.log('✅ user_settings updated')

    // Step 4: Update user_profiles if exists
    console.log('📝 Step 4: Updating user_profiles...')
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .update({ user_id: NEW_ID })
      .eq('user_id', OLD_ID)

    if (profilesError && profilesError.code !== 'PGRST116') {
      console.log('⚠️  user_profiles update:', profilesError.message)
    } else {
      console.log('✅ user_profiles updated (or doesn\'t exist)')
    }

    // Step 5: Delete old user record
    console.log('🗑️  Step 5: Deleting old user record...')
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', OLD_ID)

    if (deleteError) {
      console.error('❌ Error deleting old user:', deleteError)
      throw deleteError
    }
    console.log('✅ Old user record deleted')

    // Step 6: Verify migration
    console.log('\n🔍 Verifying migration...')
    const { data: newUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', EMAIL)
      .eq('tenant_id', 'artlee')
      .single()

    if (newUser && newUser.id === NEW_ID) {
      console.log('✅ SUCCESS! User migrated successfully')
      console.log(`   ID: ${newUser.id}`)
      console.log(`   Email: ${newUser.email}`)
      console.log(`   Name: ${newUser.name}`)
      console.log(`   Role: ${newUser.role}`)
      console.log(`   Active: ${newUser.is_active}`)

      console.log('\n🔓 You can now login with:')
      console.log(`   Email: ${EMAIL}`)
      console.log(`   Password: test1000!`)
      console.log('\n🌐 Go to: http://localhost:3002')
    } else {
      console.log('⚠️  Verification failed')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\n⚠️  You may need to manually clean up any partial changes')
  }
}

migrateUserId()
