import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Encryption service (simplified)
const decryptString = async (encryptedData) => {
  try {
    const data = JSON.parse(encryptedData)
    // For now, just return the data structure
    // The actual password is stored in bcrypt hash format
    return data
  } catch (error) {
    console.error('Error parsing encrypted data:', error)
    return null
  }
}

async function verifyPassword() {
  const testEmail = 'pierre@phaetonai.com'
  const testPassword = '$Ineed1millie$_phaetonai'

  console.log('🔐 PASSWORD VERIFICATION SCRIPT')
  console.log('='.repeat(60))
  console.log(`Testing: ${testEmail}`)
  console.log(`Password: ${testPassword}`)
  console.log('='.repeat(60))
  console.log()

  try {
    // 1. Get user
    console.log('📋 Step 1: Fetching user...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .eq('tenant_id', 'phaeton_ai')
      .single()

    if (userError || !user) {
      console.error('❌ User not found')
      return
    }

    console.log('✅ User found:', user.id)

    // 2. Get encrypted password from user_profiles
    console.log('\n📋 Step 2: Fetching encrypted password from user_profiles...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('encrypted_retell_api_key')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ No user_profile found')
      return
    }

    if (!profile.encrypted_retell_api_key) {
      console.error('❌ No encrypted data in profile')
      return
    }

    console.log('✅ Found encrypted data')
    console.log('\n📊 Raw encrypted data (first 200 chars):')
    console.log(profile.encrypted_retell_api_key.substring(0, 200) + '...')

    // 3. Try to decrypt
    console.log('\n📋 Step 3: Attempting to decrypt password...')

    try {
      const decrypted = JSON.parse(profile.encrypted_retell_api_key)
      console.log('✅ Successfully parsed encrypted data')
      console.log('\n📊 Decrypted structure:')
      console.log('Keys:', Object.keys(decrypted))

      if (decrypted.password) {
        console.log('\n✅ Password hash found in encrypted data')
        console.log('Password hash (first 50 chars):', decrypted.password.substring(0, 50))

        // 4. Try bcrypt verification
        console.log('\n📋 Step 4: Verifying password with bcrypt...')
        const isValid = await bcrypt.compare(testPassword, decrypted.password)

        if (isValid) {
          console.log('✅ PASSWORD IS VALID!')
          console.log('   The password matches the stored hash')
        } else {
          console.log('❌ PASSWORD IS INVALID!')
          console.log('   The password does not match the stored hash')

          // Try to identify the issue
          console.log('\n🔍 Debugging info:')
          console.log(`   - Hash starts with: ${decrypted.password.substring(0, 7)}`)
          console.log(`   - Hash length: ${decrypted.password.length}`)
          console.log(`   - Expected bcrypt format: $2a$10$... or $2b$10$...`)
        }
      } else {
        console.log('❌ No password field in decrypted data')
        console.log('Available fields:', Object.keys(decrypted))
      }
    } catch (parseError) {
      console.error('❌ Error parsing encrypted data:', parseError.message)
    }

    // 5. Check localStorage pattern
    console.log('\n📋 Step 5: Checking localStorage credential pattern...')
    console.log('💡 Tip: Check browser localStorage for:')
    console.log(`   Key: userCredentials_${user.id}`)
    console.log('   This may contain different password data than Supabase')

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

verifyPassword()
  .then(() => {
    console.log('\n✅ Verification complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error)
    process.exit(1)
  })
