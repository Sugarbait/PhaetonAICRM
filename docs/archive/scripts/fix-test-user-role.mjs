/**
 * Fix test@test.com role from "staff" to "user"
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

async function fixTestUserRole() {
  console.log('🔧 Fixing test@test.com role...\n')

  try {
    // Get user
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'test@test.com')
      .eq('tenant_id', 'phaeton_ai')
      .single()

    if (fetchError || !user) {
      console.error('❌ User not found:', fetchError?.message)
      return
    }

    console.log('📊 Current user data:')
    console.log('   Email:', user.email)
    console.log('   Role:', user.role, '← WRONG (should be "user")')
    console.log('   Is Active:', user.is_active)
    console.log('')

    // Fix role from "staff" to "user"
    console.log('🔄 Updating role from "staff" to "user"...')
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        role: 'user',
        is_active: true  // Ensure active as well
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error updating role:', updateError.message)
      return
    }

    console.log('✅ Role updated successfully!')
    console.log('')

    // Verify update
    const { data: updatedUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (verifyError || !updatedUser) {
      console.error('❌ Error verifying update:', verifyError?.message)
      return
    }

    console.log('✅ Verified updated user data:')
    console.log('   Email:', updatedUser.email)
    console.log('   Role:', updatedUser.role, '← CORRECT')
    console.log('   Is Active:', updatedUser.is_active)
    console.log('')
    console.log('💡 Now try logging in with:')
    console.log('   Email: test@test.com')
    console.log('   Password: test1000!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixTestUserRole()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
  })
