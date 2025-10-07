/**
 * Remove User from ARTLEE Database
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

async function removeUser() {
  try {
    const emailToRemove = 'pierre@phaetonai.com'

    console.log(`🗑️  Removing user: ${emailToRemove}\n`)

    // 1. Find the user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', emailToRemove)
      .single()

    if (findError || !user) {
      console.error('❌ User not found:', findError?.message || 'No user with this email')
      return
    }

    console.log('✅ Found user:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name || 'N/A'}`)
    console.log(`   Tenant: ${user.tenant_id}`)
    console.log(`   Role: ${user.role}`)
    console.log('')

    // 2. Delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    if (deleteError) {
      console.error('❌ Failed to delete user:', deleteError.message)
      return
    }

    console.log('✅ User successfully deleted!')
    console.log('')
    console.log('🎉 User has been removed from the database')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

removeUser()
