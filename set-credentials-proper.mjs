/**
 * Set ARTLEE Credentials with Proper Encryption
 * Matches the app's HIPAAEncryptionService format exactly
 */

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Encryption settings matching HIPAAEncryptionService
const MASTER_PASSWORD = 'hipaa-compliant-key-2024'
const SALT = Buffer.from([0x48, 0x49, 0x50, 0x41, 0x41, 0x2D, 0x43, 0x52, 0x4D, 0x2D, 0x32, 0x30, 0x32, 0x34, 0x2D, 0x53]) // "HIPAA-CRM-2024-S"
const ITERATIONS = 100000
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 12 // 96 bits for GCM
const TAG_LENGTH = 16 // 128 bits

// Derive encryption key
function deriveKey() {
  return crypto.pbkdf2Sync(
    MASTER_PASSWORD,
    SALT,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  )
}

// Encrypt string matching HIPAAEncryptionService.encryptString format
function encryptString(plaintext) {
  const key = deriveKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  let encrypted = cipher.update(plaintext, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])

  const tag = cipher.getAuthTag()

  // Format: data:iv:tag:timestamp (matching line 295 of encryption.ts)
  return `${encrypted.toString('base64')}:${iv.toString('base64')}:${tag.toString('base64')}:${Date.now()}`
}

async function setCredentials() {
  console.log('🔐 Setting ARTLEE credentials with proper encryption...\n')

  const USER_ID = 'd4ca7563-c542-44b4-bb9c-f4d8fb5ab71a'
  const EMAIL = 'create@artlee.agency'
  const PASSWORD = 'test1000!'

  try {
    console.log('📋 Account Details:')
    console.log(`   User ID: ${USER_ID}`)
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}\n`)

    // STEP 1: Encrypt password
    console.log('🔐 Step 1/4: Encrypting password...')
    const encryptedPassword = encryptString(PASSWORD)
    console.log('   Format: data:iv:tag:timestamp ✓')

    // STEP 2: Create credentials object
    console.log('📦 Step 2/4: Creating credentials object...')
    const credentials = {
      email: EMAIL,
      password: encryptedPassword,
      tempPassword: false
    }

    // STEP 3: Encrypt credentials object
    console.log('🔐 Step 3/4: Encrypting credentials object...')
    const encryptedCredentials = encryptString(JSON.stringify(credentials))

    // STEP 4: Store in both locations
    console.log('💾 Step 4/4: Storing credentials...')

    // Store in localStorage format (you'll need to set this in browser)
    console.log('\n✅ Encrypted credentials ready!')
    console.log('\n📝 Copy this value and paste in browser console:')
    console.log(`localStorage.setItem('userCredentials_${USER_ID}', '${encryptedCredentials}')`)

    // Store in database
    console.log('\n☁️  Storing in database...')
    const { error } = await supabase
      .from('user_settings')
      .update({
        retell_config: {
          encrypted_credentials: encryptedCredentials
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', USER_ID)

    if (error) {
      console.error('❌ Database error:', error)
      console.log('⚠️  But localStorage command above will still work!')
    } else {
      console.log('✅ Stored in database successfully!')
    }

    console.log('\n🎯 Next Steps:')
    console.log('1. Open browser console at http://localhost:3002')
    console.log('2. Paste the localStorage command above')
    console.log('3. Press Enter')
    console.log('4. Refresh the page')
    console.log('5. Login with:')
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

setCredentials()
