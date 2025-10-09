/**
 * Reset ARTLEE User Password
 * Sets password for create@artlee.agency
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

async function resetArtleePassword() {
  console.log('🔑 Resetting password for ARTLEE user...\n')

  try {
    const USER_ID = 'd4ca7563-c542-44b4-bb9c-f4d8fb5ab71a'
    const EMAIL = 'create@artlee.agency'
    const NEW_PASSWORD = 'test1000!'

    console.log('📋 Account Details:')
    console.log(`   User ID: ${USER_ID}`)
    console.log(`   Email: ${EMAIL}`)
    console.log(`   New Password: ${NEW_PASSWORD}`)
    console.log(`   Tenant: artlee\n`)

    // Update password in Supabase Auth
    const { data, error } = await supabase.auth.admin.updateUserById(
      USER_ID,
      {
        password: NEW_PASSWORD,
        email_confirm: true
      }
    )

    if (error) {
      console.error('❌ Error resetting password:', error)
      return
    }

    console.log('✅ Password reset successfully!')
    console.log('\n🔓 NEW Login Credentials:')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${NEW_PASSWORD}`)
    console.log('\n💡 You can now login at: http://localhost:3002')

  } catch (error) {
    console.error('❌ Reset failed:', error)
  }
}

// Run
resetArtleePassword()
