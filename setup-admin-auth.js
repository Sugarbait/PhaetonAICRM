/**
 * Setup Admin Auth
 * Creates Supabase Auth credentials for admin@phaetonai.com
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

async function setupAdminAuth() {
  console.log('🔐 Setting up auth for admin@phaetonai.com...\n')

  try {
    const EMAIL = 'admin@phaetonai.com'
    const PASSWORD = 'Admin123!'  // You can change this
    const USER_ID = 'f99057b7-23bf-4d1b-8104-1f715a1a9851'

    console.log('📋 Credentials:')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}`)
    console.log(`   Database User ID: ${USER_ID}\n`)

    // Check if auth user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === EMAIL)

    if (existingUser) {
      console.log('⚠️  Auth user already exists, updating password...')

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: PASSWORD }
      )

      if (updateError) {
        console.error('❌ Error updating password:', updateError)
        return
      }

      console.log('✅ Password updated successfully!')
      console.log(`\n🔑 Auth User ID: ${existingUser.id}`)

      // Update the database user record with the auth ID
      const { error: dbUpdateError } = await supabase
        .from('users')
        .update({
          id: existingUser.id,  // Update to match auth ID
          tenant_id: 'medex',
          role: 'super_user',
          updated_at: new Date().toISOString()
        })
        .eq('id', USER_ID)

      if (dbUpdateError) {
        console.log('⚠️  Database update note:', dbUpdateError.message)
      }

    } else {
      console.log('📝 Creating new auth user...')

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: 'Admin User',
          role: 'super_user',
          tenant_id: 'medex'
        }
      })

      if (createError) {
        console.error('❌ Error creating auth user:', createError)
        return
      }

      console.log('✅ Auth user created successfully!')
      console.log(`\n🔑 Auth User ID: ${newUser.user.id}`)

      // Update the database user record with the new auth ID
      const { error: dbUpdateError } = await supabase
        .from('users')
        .update({
          id: newUser.user.id,  // Update to match auth ID
          tenant_id: 'medex',
          role: 'super_user',
          updated_at: new Date().toISOString()
        })
        .eq('id', USER_ID)

      if (dbUpdateError) {
        console.log('⚠️  Database update note:', dbUpdateError.message)
      }
    }

    console.log('\n✅ Setup complete!')
    console.log('\n🔓 Login Credentials:')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}`)
    console.log('\n💡 Next steps:')
    console.log('   1. Clear browser cache: localStorage.clear(); location.reload()')
    console.log('   2. Go to login page')
    console.log('   3. Use credentials above to log in')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run
setupAdminAuth()
