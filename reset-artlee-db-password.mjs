/**
 * Reset ARTLEE User Password (Database-Only)
 * Sets password for create@artlee.agency in database credentials
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetDatabasePassword() {
  console.log('🔑 Resetting database password for ARTLEE user...\n')

  try {
    const USER_ID = 'd4ca7563-c542-44b4-bb9c-f4d8fb5ab71a'
    const EMAIL = 'create@artlee.agency'
    const NEW_PASSWORD = 'test1000!'

    console.log('📋 Account Details:')
    console.log(`   User ID: ${USER_ID}`)
    console.log(`   Email: ${EMAIL}`)
    console.log(`   New Password: ${NEW_PASSWORD}`)
    console.log(`   Tenant: artlee\n`)

    // Hash the password using bcrypt
    console.log('🔐 Hashing password...')
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10)
    console.log('✅ Password hashed\n')

    // Update password in user_credentials table
    console.log('💾 Updating database credentials...')
    const { data, error } = await supabase
      .from('user_credentials')
      .upsert({
        user_id: USER_ID,
        password: hashedPassword,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('❌ Error updating credentials:', error)
      return
    }

    console.log('✅ Password updated successfully in database!')
    console.log('\n🔓 NEW Login Credentials:')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${NEW_PASSWORD}`)
    console.log('\n💡 You can now login at: http://localhost:3002')

  } catch (error) {
    console.error('❌ Reset failed:', error)
  }
}

// Run
resetDatabasePassword()
