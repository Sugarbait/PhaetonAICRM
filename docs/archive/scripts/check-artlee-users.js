/**
 * Check ARTLEE Users Only
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

async function checkArtleeUsers() {
  try {
    console.log('🔍 Checking ARTLEE tenant users...\n')

    // Get ARTLEE users only
    const { data: artleeUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', 'artlee')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching ARTLEE users:', error)
      return
    }

    if (!artleeUsers || artleeUsers.length === 0) {
      console.log('⚠️  No ARTLEE users found in database')
      console.log('💡 You may need to register a new user for ARTLEE tenant')
      return
    }

    console.log(`Found ${artleeUsers.length} ARTLEE user(s):\n`)

    artleeUsers.forEach(user => {
      console.log(`📧 Email: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.name || 'N/A'}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.is_active}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkArtleeUsers()
