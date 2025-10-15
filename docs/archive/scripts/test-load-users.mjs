import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY // Use ANON key like the app does

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 TESTING loadSystemUsers() BEHAVIOR')
console.log('='.repeat(60))
console.log()

async function testLoadUsers() {
  try {
    // Test 1: Direct query to users table with tenant filter (what loadSystemUsers does)
    console.log('📋 Test 1: Query users table with tenant_id=phaeton_ai...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', 'phaeton_ai')

    if (usersError) {
      console.error('❌ Error:', usersError)
      console.log('\n🔍 Checking if this is an RLS policy issue...')

      // Try with service role key
      console.log('\n📋 Test 2: Trying with service role key...')
      const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      if (serviceKey) {
        const serviceSupabase = createClient(supabaseUrl, serviceKey)
        const { data: serviceUsers, error: serviceError } = await serviceSupabase
          .from('users')
          .select('*')
          .eq('tenant_id', 'phaeton_ai')

        if (serviceError) {
          console.error('❌ Service role also failed:', serviceError)
        } else {
          console.log('✅ Service role key works!')
          console.log(`Found ${serviceUsers?.length || 0} users`)
          if (serviceUsers && serviceUsers.length > 0) {
            serviceUsers.forEach((user, i) => {
              console.log(`\n   User ${i + 1}:`)
              console.log(`   - Email: ${user.email}`)
              console.log(`   - Role: ${user.role}`)
              console.log(`   - Active: ${user.is_active}`)
            })
          }

          console.log('\n❗ DIAGNOSIS: RLS policies are blocking unauthenticated read access')
          console.log('   The login page cannot see users because there is no authenticated user yet')
          console.log('   This causes "Be the first to register" to show even though users exist')
        }
      }
    } else {
      console.log('✅ Anon key works!')
      console.log(`Found ${users?.length || 0} users`)
      if (users && users.length > 0) {
        users.forEach((user, i) => {
          console.log(`\n   User ${i + 1}:`)
          console.log(`   - Email: ${user.email}`)
          console.log(`   - Role: ${user.role}`)
          console.log(`   - Active: ${user.is_active}`)
        })
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📝 SOLUTION:')
    console.log('='.repeat(60))

    if (usersError) {
      console.log('\n1. The RLS policies DO allow reading users (we just fixed that)')
      console.log('2. BUT the login page still shows "Be the first to register"')
      console.log('3. This means loadSystemUsers() is returning empty results')
      console.log('\n💡 LIKELY CAUSE:')
      console.log('   - The ANON key RLS policies may not be working correctly')
      console.log('   - Or the query is using a different approach that fails')
      console.log('\n🔧 FIX:')
      console.log('   - Check if loadSystemUsers() is using anon key or service key')
      console.log('   - Verify RLS policies allow SELECT with anon key')
      console.log('   - User pierre@phaetonai.com exists and should be able to login')
    } else {
      console.log('\n✅ Users are visible with anon key')
      console.log('   The RLS policies are working correctly')
      console.log('   Login should work normally')
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

testLoadUsers()
  .then(() => {
    console.log('\n✅ Test complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
