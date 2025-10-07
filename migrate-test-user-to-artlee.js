/**
 * Migrate test@test.com from CAREXPS to ARTLEE tenant
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateUser() {
  try {
    const targetEmail = 'test@test.com'

    console.log(`🔄 Migrating ${targetEmail} to ARTLEE tenant...\n`)

    // 1. Find the user in CAREXPS tenant
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', targetEmail)
      .eq('tenant_id', 'carexps')
      .single()

    if (findError || !existingUser) {
      console.error('❌ User not found in CAREXPS tenant')
      console.error('Error:', findError)
      return
    }

    console.log('✅ Found user in CAREXPS tenant:')
    console.log(`   ID: ${existingUser.id}`)
    console.log(`   Email: ${existingUser.email}`)
    console.log(`   Name: ${existingUser.name || 'N/A'}`)
    console.log(`   Current Tenant: ${existingUser.tenant_id}`)
    console.log('')

    // 2. Update user to ARTLEE tenant and make them super_user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        tenant_id: 'artlee',
        role: 'super_user',  // First ARTLEE user should be super_user
        updated_at: new Date().toISOString()
      })
      .eq('id', existingUser.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Migration failed:', updateError.message)
      return
    }

    console.log('✅ User successfully migrated to ARTLEE tenant!')
    console.log('   New Tenant: artlee')
    console.log('   Role: super_user')
    console.log('')
    console.log('🎉 You can now log in with:')
    console.log(`   Email: ${targetEmail}`)
    console.log(`   Password: [your password]`)
    console.log('')
    console.log('💡 Clear your browser localStorage and refresh the page.')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

migrateUser()
