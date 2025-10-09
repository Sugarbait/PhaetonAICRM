/**
 * Create ARTLEE User in Supabase Auth
 * This is the PROPER way - user should exist in Supabase Auth system
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

async function createAuthUser() {
  console.log('🔐 Creating ARTLEE user in Supabase Auth...\n')

  const EMAIL = 'create@artlee.agency'
  const PASSWORD = 'test1000!'
  const USER_ID = 'd4ca7563-c542-44b4-bb9c-f4d8fb5ab71a'

  try {
    console.log('📋 Account Details:')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}`)
    console.log(`   User ID: ${USER_ID}\n`)

    // Check if user already exists in Auth
    console.log('🔍 Checking if user exists in Supabase Auth...')
    const { data: existingUser } = await supabase.auth.admin.getUserById(USER_ID)

    if (existingUser?.user) {
      console.log('⚠️  User already exists in Supabase Auth')
      console.log('📝 Updating password...')

      // Update existing user's password
      const { data, error } = await supabase.auth.admin.updateUserById(USER_ID, {
        password: PASSWORD,
        email_confirm: true
      })

      if (error) {
        console.error('❌ Error updating password:', error)
        return
      }

      console.log('✅ Password updated successfully!')
    } else {
      console.log('📝 User does not exist, creating new auth user...')

      // Create new user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: 'Test',
          tenant_id: 'artlee'
        }
      })

      if (error) {
        console.error('❌ Error creating user:', error)
        return
      }

      console.log('✅ User created in Supabase Auth!')
      console.log(`   Auth User ID: ${data.user?.id}`)
    }

    console.log('\n✅ SUCCESS! User is now in Supabase Auth system')
    console.log('\n🔓 You can now login with:')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}`)
    console.log('\n🌐 Go to: http://localhost:3002')

  } catch (error) {
    console.error('❌ Failed:', error)
  }
}

createAuthUser()
