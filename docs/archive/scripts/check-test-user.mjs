/**
 * Check test@test.com user status in Supabase
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

async function checkTestUser() {
  console.log('🔍 Checking test@test.com user status...\n')

  try {
    // Get user from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', 'test@test.com')
      .eq('tenant_id', 'phaeton_ai')
      .single()

    if (error) {
      console.error('❌ Error fetching user:', error.message)
      return
    }

    if (!user) {
      console.log('❌ User not found in Supabase')
      return
    }

    console.log('✅ User found in Supabase:')
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   Role:', user.role)
    console.log('   Is Active:', user.is_active)
    console.log('   Tenant ID:', user.tenant_id)
    console.log('   Created:', user.created_at)
    console.log('')

    if (!user.is_active) {
      console.log('⚠️  User is NOT active - activating now...')
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ is_active: true })
        .eq('id', user.id)

      if (updateError) {
        console.error('❌ Error activating user:', updateError.message)
      } else {
        console.log('✅ User activated successfully!')
        console.log('   Try logging in again now.')
      }
    } else {
      console.log('✅ User is already active - should be able to login')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkTestUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
  })
