/**
 * Store ARTLEE Credentials in Database
 * Stores in user_settings.retell_config for cross-device sync
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'
const ENCRYPTION_KEY = Buffer.from('7f3e9a2b8c1d4f6e5a8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f', 'hex')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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

async function storeCredentials() {
  console.log('🔐 Storing ARTLEE credentials in database...\n')

  try {
    const USER_ID = 'd4ca7563-c542-44b4-bb9c-f4d8fb5ab71a'
    const EMAIL = 'create@artlee.agency'
    const PASSWORD = 'test1000!'

    console.log('📋 Account Details:')
    console.log(`   User ID: ${USER_ID}`)
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}\n`)

    // STEP 1: Encrypt password
    console.log('🔐 Step 1: Encrypting password...')
    const encryptedPassword = encryptString(PASSWORD)

    // STEP 2: Create credentials object
    console.log('📦 Step 2: Creating credentials object...')
    const credentials = {
      email: EMAIL,
      password: encryptedPassword,
      tempPassword: false
    }

    // STEP 3: Encrypt credentials
    console.log('🔐 Step 3: Encrypting credentials...')
    const encryptedCredentials = encryptString(JSON.stringify(credentials))

    // STEP 4: Store in database
    console.log('☁️  Step 4: Storing in user_settings.retell_config...')
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        retell_config: {
          encrypted_credentials: encryptedCredentials
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', USER_ID)
      .select()

    if (error) {
      console.error('❌ Database error:', error)
      return
    }

    console.log('✅ Credentials stored in database successfully!')
    console.log('\n🌐 Cross-Device Login Enabled!')
    console.log('   You can now login from any device with:')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}`)

  } catch (error) {
    console.error('❌ Failed:', error)
  }
}

storeCredentials()
