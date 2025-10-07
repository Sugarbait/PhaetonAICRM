/**
 * Setup Admin Password
 * Creates/updates authentication for admin@phaetonai.com
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function setupAdminPassword() {
  console.log('🔐 Setting up password for admin@phaetonai.com...\n')

  try {
    const EMAIL = 'admin@phaetonai.com'
    const USER_ID = 'f99057b7-23bf-4d1b-8104-1f715a1a9851'

    // Ask user for desired password
    console.log('💡 What password would you like to set?')
    console.log('   (You can change this in the script if needed)\n')

    const DEFAULT_PASSWORD = 'Admin123!'
    console.log(`Using password: ${DEFAULT_PASSWORD}`)

    // Hash the password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    console.log('✅ Password hashed')

    // Update user with hashed password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', USER_ID)

    if (updateError) {
      console.error('❌ Error updating password:', updateError)
      return
    }

    console.log('✅ Password set successfully!')
    console.log('\n📋 Login Credentials:')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${DEFAULT_PASSWORD}`)
    console.log('\n💡 You can now log in with these credentials')
    console.log('   Make sure to clear browser cache first: localStorage.clear(); location.reload()')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run the setup
setupAdminPassword()
