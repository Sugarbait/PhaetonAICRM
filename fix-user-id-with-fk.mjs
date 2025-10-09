/**
 * Fix ARTLEE User ID with Foreign Key Handling
 * Updates user ID in users table AND all related tables
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

async function fixUserId() {
  console.log('🔧 Fixing ARTLEE user ID with foreign key handling...\n')

  const OLD_ID = 'd4ca7563-c542-44b4-bb9c-f4d8fb5ab71a'
  const NEW_ID = '6fb26981-a8f6-479c-9995-36cd238ca185'
  const EMAIL = 'create@artlee.agency'

  try {
    console.log('📋 IDs:')
    console.log(`   Old Database ID: ${OLD_ID}`)
    console.log(`   New Auth ID: ${NEW_ID}`)
    console.log(`   Email: ${EMAIL}\n`)

    // Step 1: Update user_settings
    console.log('📝 Step 1: Updating user_settings...')
    const { error: settingsError } = await supabase
      .from('user_settings')
      .update({ user_id: NEW_ID })
      .eq('user_id', OLD_ID)

    if (settingsError) {
      console.error('❌ Error updating user_settings:', settingsError)
      throw settingsError
    }
    console.log('✅ user_settings updated')

    // Step 2: Update user_profiles if it exists
    console.log('📝 Step 2: Updating user_profiles...')
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .update({ user_id: NEW_ID })
      .eq('user_id', OLD_ID)

    if (profilesError && profilesError.code !== 'PGRST116') {
      console.log('⚠️  user_profiles error (might not exist):', profilesError.message)
    } else {
      console.log('✅ user_profiles updated')
    }

    // Step 3: Update users table
    console.log('📝 Step 3: Updating users table...')
    const { error: usersError } = await supabase
      .from('users')
      .update({ id: NEW_ID })
      .eq('email', EMAIL)
      .eq('tenant_id', 'artlee')

    if (usersError) {
      console.error('❌ Error updating users:', usersError)
      throw usersError
    }
    console.log('✅ users table updated')

    // Step 4: Verify the fix
    console.log('\n🔍 Verifying fix...')
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', EMAIL)
      .eq('tenant_id', 'artlee')
      .single()

    if (user && user.id === NEW_ID) {
      console.log('✅ SUCCESS! User ID updated correctly')
      console.log(`   New ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)

      console.log('\n🔓 You can now login with:')
      console.log(`   Email: ${EMAIL}`)
      console.log(`   Password: test1000!`)
      console.log('\n🌐 Go to: http://localhost:3002')
    } else {
      console.log('⚠️  Verification issue - user not found or ID mismatch')
    }

  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

fixUserId()
