/**
 * Clear cached profile for test@test.com user
 * This fixes the "pending approval" error for users who were approved BEFORE the cache-clearing fix
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function clearTestUserCache() {
  console.log('🧹 Clearing cached profile for test@test.com...\n')

  try {
    // 1. Get the user ID from Supabase
    console.log('1️⃣ Looking up user in Supabase...')
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active, role')
      .eq('email', 'test@test.com')
      .eq('tenant_id', 'phaeton_ai')
      .maybeSingle()

    if (userError) {
      console.error('   ❌ Error:', userError.message)
      return
    }

    if (!user) {
      console.log('   ❌ User not found in Supabase')
      return
    }

    console.log('   ✅ User found:')
    console.log('      ID:', user.id)
    console.log('      Email:', user.email)
    console.log('      Active:', user.is_active)
    console.log('      Role:', user.role)
    console.log('')

    // 2. Verify user is active
    if (!user.is_active) {
      console.log('   ⚠️  WARNING: User is NOT active in database!')
      console.log('   💡 You need to approve this user first using the User Management page')
      return
    }

    // 3. Show instructions for clearing cache
    console.log('2️⃣ Cache clearing instructions:\n')
    console.log('   To clear the cached profile, open your browser console and run:')
    console.log('')
    console.log(`   localStorage.removeItem('userProfile_${user.id}')`)
    console.log(`   localStorage.removeItem('systemUsers')`)
    console.log('')
    console.log('   Then refresh the page and try logging in again.')
    console.log('')
    console.log('   OR you can have a Super User "Approve" the user again,')
    console.log('   which will now automatically clear the cache.')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

clearTestUserCache()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
  })
