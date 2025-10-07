/**
 * Clear All ARTLEE Users - Fresh Start
 * CRITICAL: Only removes ARTLEE tenant users, preserves MedEx and CareXPS
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

async function clearArtleeUsers() {
  try {
    console.log('🧹 Clearing all ARTLEE users for fresh start...\n')

    // 1. Get all ARTLEE users
    const { data: artleeUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', 'artlee')

    if (fetchError) {
      console.error('❌ Error fetching ARTLEE users:', fetchError.message)
      return
    }

    if (!artleeUsers || artleeUsers.length === 0) {
      console.log('✅ No ARTLEE users found - database is already clean')
      return
    }

    console.log(`Found ${artleeUsers.length} ARTLEE user(s) to delete:\n`)

    artleeUsers.forEach(user => {
      console.log(`  📧 ${user.email} (${user.role})`)
    })
    console.log('')

    // 2. Delete all ARTLEE users
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('tenant_id', 'artlee')

    if (deleteError) {
      console.error('❌ Error deleting ARTLEE users:', deleteError.message)
      return
    }

    console.log('✅ All ARTLEE users successfully deleted!')
    console.log('')
    console.log('🎉 ARTLEE database is now clean and ready for fresh start')
    console.log('💡 The next user to register will automatically become Super User')
    console.log('')
    console.log('📊 Other tenants (MedEx, CareXPS) remain unchanged')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

clearArtleeUsers()
