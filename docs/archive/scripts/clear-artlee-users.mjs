/**
 * Clear all ARTLEE users - Start Fresh
 * Deletes all users with tenant_id = 'artlee' from database and Supabase Auth
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

async function clearArtleeUsers() {
  console.log('🧹 Clearing all ARTLEE users...\n')

  try {
    // Step 1: Get all ARTLEE users
    console.log('📋 Step 1: Fetching all ARTLEE users...')
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('tenant_id', 'artlee')

    if (fetchError) {
      throw fetchError
    }

    if (!users || users.length === 0) {
      console.log('✅ No ARTLEE users found - database is already clean!')
      return
    }

    console.log(`📊 Found ${users.length} ARTLEE users:`)
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.name}, ${user.role})`)
    })
    console.log()

    // Step 2: Delete related records from user_settings
    console.log('🗑️  Step 2: Deleting user_settings records...')
    for (const user of users) {
      const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id)

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.log(`⚠️  Warning: Could not delete settings for ${user.email}:`, settingsError.message)
      }
    }
    console.log('✅ user_settings cleaned')

    // Step 3: Delete related records from user_profiles
    console.log('🗑️  Step 3: Deleting user_profiles records...')
    for (const user of users) {
      const { error: profilesError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id)

      if (profilesError && profilesError.code !== 'PGRST116') {
        console.log(`⚠️  Warning: Could not delete profile for ${user.email}:`, profilesError.message)
      }
    }
    console.log('✅ user_profiles cleaned')

    // Step 4: Delete users from database
    console.log('🗑️  Step 4: Deleting users from database...')
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('tenant_id', 'artlee')

    if (deleteError) {
      throw deleteError
    }
    console.log('✅ Database users deleted')

    // Step 5: Delete Supabase Auth users
    console.log('🗑️  Step 5: Deleting Supabase Auth users...')
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()

    let authDeletedCount = 0
    for (const user of users) {
      const authUser = authUsers.find(u => u.id === user.id || u.email === user.email)
      if (authUser) {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUser.id)
        if (authDeleteError) {
          console.log(`⚠️  Warning: Could not delete Auth user ${user.email}:`, authDeleteError.message)
        } else {
          authDeletedCount++
        }
      }
    }
    console.log(`✅ Supabase Auth users deleted: ${authDeletedCount}/${users.length}`)

    // Step 6: Verify cleanup
    console.log('\n🔍 Verifying cleanup...')
    const { data: remainingUsers } = await supabase
      .from('users')
      .select('id, email')
      .eq('tenant_id', 'artlee')

    if (remainingUsers && remainingUsers.length === 0) {
      console.log('✅ ✅ ✅ SUCCESS! All ARTLEE users deleted! ✅ ✅ ✅')
      console.log('\n🎉 ARTLEE tenant is now clean and ready for fresh users!')
      console.log('\n📝 Next steps:')
      console.log('   1. Register your first user at http://localhost:3002')
      console.log('   2. First user will automatically become Super User')
      console.log('   3. Additional users will require Super User approval')
    } else {
      console.log('⚠️  Warning: Some users may remain:', remainingUsers)
    }

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error)
  }
}

clearArtleeUsers()
