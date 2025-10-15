/**
 * Approve test@test.com user by setting is_active to true
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

async function approveTestUser() {
  console.log('🔓 Approving test@test.com user...\n')

  try {
    // 1. Get the user
    console.log('1️⃣ Looking up user in Supabase...')
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
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
    console.log('      Current Active Status:', user.is_active)
    console.log('      Role:', user.role)
    console.log('')

    // 2. Update to active
    console.log('2️⃣ Setting is_active to true...')
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_active: true
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('   ❌ Error updating user:', updateError.message)
      return
    }

    console.log('   ✅ User approved successfully!')
    console.log('')

    // 3. Verify update
    console.log('3️⃣ Verifying update...')
    const { data: updatedUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('id, email, is_active, role')
      .eq('id', user.id)
      .single()

    if (verifyError) {
      console.error('   ❌ Error verifying update:', verifyError.message)
      return
    }

    console.log('   ✅ Verified user status:')
    console.log('      ID:', updatedUser.id)
    console.log('      Email:', updatedUser.email)
    console.log('      Active:', updatedUser.is_active)
    console.log('      Role:', updatedUser.role)
    console.log('')

    console.log('=' .repeat(80))
    console.log('✅ USER APPROVED SUCCESSFULLY')
    console.log('=' .repeat(80))
    console.log('')
    console.log('💡 Now clear the cache in your browser console:')
    console.log('')
    console.log(`   localStorage.removeItem('userProfile_${user.id}')`)
    console.log(`   localStorage.removeItem('systemUsers')`)
    console.log('')
    console.log('   Then try logging in with:')
    console.log('   Email: test@test.com')
    console.log('   Password: test1000!')
    console.log('')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

approveTestUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
  })
