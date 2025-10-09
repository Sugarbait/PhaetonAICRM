/**
 * Create Supabase Auth user for test@test.com
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
  console.log('🔧 Creating Supabase Auth user for test@test.com...\n')

  const DB_USER_ID = '246dc1d4-bc07-4fbc-86ad-a9bb26d39231'
  const EMAIL = 'test@test.com'
  const PASSWORD = 'test1000!'

  try {
    // Create auth user with specific ID to match database
    console.log('📝 Creating Supabase Auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: 'test',
        tenant_id: 'artlee'
      },
      // Try to use same ID as database user
      id: DB_USER_ID
    })

    if (authError) {
      console.error('❌ Error creating auth user:', authError)

      // If ID already exists, delete and recreate
      if (authError.message.includes('already exists')) {
        console.log('🔄 Auth user already exists, deleting and recreating...')

        // Delete existing auth user
        await supabase.auth.admin.deleteUser(DB_USER_ID)
        console.log('✅ Deleted existing auth user')

        // Recreate
        const { data: retryData, error: retryError } = await supabase.auth.admin.createUser({
          email: EMAIL,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: {
            name: 'test',
            tenant_id: 'artlee'
          },
          id: DB_USER_ID
        })

        if (retryError) {
          throw retryError
        }

        console.log('✅ Auth user recreated successfully')
      } else {
        throw authError
      }
    } else {
      console.log('✅ Auth user created successfully')
    }

    // Verify
    console.log('\n🔍 Verifying...')
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const authUser = users.find(u => u.email === EMAIL)

    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', EMAIL)
      .eq('tenant_id', 'artlee')
      .single()

    if (authUser && dbUser && authUser.id === dbUser.id) {
      console.log('✅ ✅ ✅ SUCCESS! ✅ ✅ ✅')
      console.log(`\n   Database ID: ${dbUser.id}`)
      console.log(`   Auth ID: ${authUser.id}`)
      console.log(`   IDs Match: ✅ YES`)
      console.log(`\n   Email: ${EMAIL}`)
      console.log(`   Password: ${PASSWORD}`)
      console.log('\n🌐 You can now login at: http://localhost:3002')
      console.log('✅ Login will work in private browsing mode!')
    } else {
      console.log('⚠️ Verification issue')
    }

  } catch (error) {
    console.error('\n❌ Failed:', error)
  }
}

createAuthUser()
