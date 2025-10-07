/**
 * Make First ARTLEE User a Super User
 *
 * This script updates the first ARTLEE user to have super_user role
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeFirstArtleeUserSuper() {
  try {
    console.log('🔍 Finding ARTLEE users...')

    // Get all ARTLEE users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', 'artlee')
      .order('created_at', { ascending: true })

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No ARTLEE users found in the database')
      return
    }

    console.log(`✅ Found ${users.length} ARTLEE user(s)`)

    // Get the first user (oldest created_at)
    const firstUser = users[0]

    console.log(`\n👤 First ARTLEE User:`)
    console.log(`   Email: ${firstUser.email}`)
    console.log(`   Name: ${firstUser.name || firstUser.username}`)
    console.log(`   Current Role: ${firstUser.role}`)
    console.log(`   Created: ${firstUser.created_at}`)

    if (firstUser.role === 'super_user') {
      console.log('\n✅ User already has super_user role!')
      return
    }

    // Update to super_user
    console.log('\n🔄 Updating user to super_user role...')

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        role: 'super_user',
        is_active: true // Ensure they're active
      })
      .eq('id', firstUser.id)
      .select()

    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return
    }

    console.log('✅ Successfully updated user to Super User!')
    console.log('\n👑 Super User Details:')
    console.log(`   Email: ${firstUser.email}`)
    console.log(`   Role: super_user`)
    console.log(`   Status: Active`)
    console.log('\n🎉 The first ARTLEE user now has full admin access!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

makeFirstArtleeUserSuper()
