import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔍 PHAETON AI USER DIAGNOSTIC SCRIPT')
console.log('=' .repeat(60))
console.log()

async function checkUserExists() {
  let profile = null
  let credentials = null
  let pierreUser = null

  try {
    // 1. Check ALL users in phaeton_ai tenant
    console.log('📋 Step 1: Checking ALL users in phaeton_ai tenant...')
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', 'phaeton_ai')

    if (allUsersError) {
      console.error('❌ Error fetching users:', allUsersError)
      throw allUsersError
    }

    console.log(`✅ Found ${allUsers?.length || 0} users in phaeton_ai tenant`)

    if (allUsers && allUsers.length > 0) {
      console.log('\n📊 All users in phaeton_ai:')
      allUsers.forEach((user, index) => {
        console.log(`\n   User ${index + 1}:`)
        console.log(`   - ID: ${user.id}`)
        console.log(`   - Email: ${user.email}`)
        console.log(`   - Role: ${user.role}`)
        console.log(`   - Active: ${user.is_active}`)
        console.log(`   - Tenant: ${user.tenant_id}`)
        console.log(`   - Created: ${user.created_at}`)
      })
    } else {
      console.log('⚠️  NO USERS FOUND in phaeton_ai tenant!')
      console.log('   This explains why login shows "Be the first to register"')
    }

    console.log('\n' + '─'.repeat(60))

    // 2. Check specifically for pierre@phaetonai.com
    console.log('\n📧 Step 2: Checking for pierre@phaetonai.com...')
    const { data: pierreData, error: pierreError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'pierre@phaetonai.com')
      .eq('tenant_id', 'phaeton_ai')
      .single()

    pierreUser = pierreData

    if (pierreError) {
      if (pierreError.code === 'PGRST116') {
        console.log('❌ User pierre@phaetonai.com NOT FOUND in phaeton_ai tenant')
      } else {
        console.error('❌ Error:', pierreError)
      }
    } else if (pierreUser) {
      console.log('✅ User pierre@phaetonai.com FOUND!')
      console.log('\n📊 User Details:')
      console.log(`   - ID: ${pierreUser.id}`)
      console.log(`   - Email: ${pierreUser.email}`)
      console.log(`   - Role: ${pierreUser.role}`)
      console.log(`   - Active: ${pierreUser.is_active}`)
      console.log(`   - Tenant: ${pierreUser.tenant_id}`)
      console.log(`   - Created: ${pierreUser.created_at}`)

      // 3. Check user_profiles for encrypted password
      console.log('\n🔐 Step 3: Checking user_profiles for password data...')
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, encrypted_retell_api_key')
        .eq('user_id', pierreUser.id)
        .single()

      profile = profileData

      if (profileError) {
        console.log('❌ No user_profile found for this user')
        console.log('   This means no encrypted password data exists!')
      } else if (profile) {
        console.log('✅ user_profile entry found')
        console.log(`   - Has encrypted data: ${profile.encrypted_retell_api_key ? 'YES' : 'NO'}`)

        if (!profile.encrypted_retell_api_key) {
          console.log('   ⚠️  WARNING: No encrypted password stored!')
        }
      }

      // 4. Check user_credentials
      console.log('\n🔑 Step 4: Checking user_credentials table...')
      const { data: credData, error: credError } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('user_id', pierreUser.id)
        .single()

      credentials = credData

      if (credError) {
        console.log('❌ No credentials found in user_credentials table')
      } else if (credentials) {
        console.log('✅ Credentials entry found')
        console.log(`   - Has password: ${credentials.password ? 'YES' : 'NO'}`)
        console.log(`   - Created: ${credentials.created_at}`)
      }
    }

    console.log('\n' + '─'.repeat(60))

    // 5. Check Supabase Auth users
    console.log('\n🔐 Step 5: Checking Supabase Auth for pierre@phaetonai.com...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error listing auth users:', authError)
    } else {
      const pierreAuthUser = authUsers.users.find(u => u.email === 'pierre@phaetonai.com')

      if (pierreAuthUser) {
        console.log('✅ User EXISTS in Supabase Auth')
        console.log(`   - Auth ID: ${pierreAuthUser.id}`)
        console.log(`   - Email: ${pierreAuthUser.email}`)
        console.log(`   - Confirmed: ${pierreAuthUser.email_confirmed_at ? 'YES' : 'NO'}`)
        console.log(`   - Created: ${pierreAuthUser.created_at}`)
      } else {
        console.log('❌ User NOT FOUND in Supabase Auth')
        console.log('   This is database-only authentication')
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📝 DIAGNOSIS SUMMARY:')
    console.log('=' .repeat(60))

    if (!allUsers || allUsers.length === 0) {
      console.log('\n❌ PROBLEM IDENTIFIED:')
      console.log('   NO users exist in the phaeton_ai tenant!')
      console.log('\n💡 SOLUTION:')
      console.log('   User needs to REGISTER first using the registration form')
      console.log('   The "Be the first to register" message is CORRECT')
      console.log('\n📋 NEXT STEPS:')
      console.log('   1. Go to registration page')
      console.log('   2. Register with pierre@phaetonai.com')
      console.log('   3. Use password: $Ineed1millie$_phaetonai')
      console.log('   4. First user will be auto-assigned as super_user')
    } else if (!pierreUser) {
      console.log('\n⚠️  PROBLEM IDENTIFIED:')
      console.log('   Users exist in phaeton_ai, but pierre@phaetonai.com is NOT one of them')
      console.log('\n💡 SOLUTION:')
      console.log('   Register pierre@phaetonai.com through the registration form')
    } else {
      console.log('\n✅ User pierre@phaetonai.com EXISTS')

      if (!pierreUser.is_active) {
        console.log('\n❌ PROBLEM: User is NOT ACTIVE')
        console.log('   An admin needs to activate this user')
      } else {
        console.log('\n✅ User is ACTIVE')
      }

      // Check if we have profile and credentials data
      const hasProfile = !!profile?.encrypted_retell_api_key
      const hasCredentials = !!credentials?.password

      if (!hasProfile && !hasCredentials) {
        console.log('\n❌ PROBLEM: No password data found')
        console.log('   Password was never stored during registration')
        console.log('\n💡 SOLUTION:')
        console.log('   User needs to be deleted and re-registered')
      } else {
        console.log('\n✅ Password data exists')
        if (hasProfile) console.log('   - Found in user_profiles (encrypted_retell_api_key)')
        if (hasCredentials) console.log('   - Found in user_credentials')
      }
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run the diagnostic
checkUserExists()
  .then(() => {
    console.log('\n✅ Diagnostic complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic failed:', error)
    process.exit(1)
  })
