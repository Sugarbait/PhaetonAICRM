/**
 * Reset ARTLEE User Password
 * Updates password for create@artlee.agency
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

// Encryption key (from your app)
const ENCRYPTION_KEY = Buffer.from('7f3e9a2b8c1d4f6e5a8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f', 'hex')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Encryption functions (matching your app's encryption service)
function encryptString(text) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  return JSON.stringify({
    iv: iv.toString('base64'),
    data: encrypted,
    authTag: authTag.toString('base64')
  })
}

async function resetPassword() {
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

    // Step 1: Encrypt the password
    console.log('🔐 Encrypting password...')
    const encryptedPassword = encryptString(NEW_PASSWORD)

    // Step 2: Create credentials object
    const credentials = {
      email: EMAIL,
      password: encryptedPassword,
      tempPassword: false
    }

    // Step 3: Encrypt the entire credentials object
    console.log('🔐 Encrypting credentials...')
    const encryptedCredentials = encryptString(JSON.stringify(credentials))

    // Step 4: Store in Supabase user_profiles table
    console.log('💾 Storing credentials in database...')
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: USER_ID,
        encrypted_retell_api_key: encryptedCredentials
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('❌ Error storing credentials:', error)
      return
    }

    console.log('✅ Password reset successfully!')
    console.log('\n🔓 NEW Login Credentials:')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${NEW_PASSWORD}`)
    console.log('\n💡 You can now login at: http://localhost:3002')
    console.log('💡 Clear browser localStorage if needed')

  } catch (error) {
    console.error('❌ Reset failed:', error)
  }
}

// Run
resetPassword()
