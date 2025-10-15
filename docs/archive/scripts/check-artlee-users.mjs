/**
 * Check ARTLEE User Accounts
 * Lists all users with tenant_id = 'artlee'
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkArtleeUsers() {
  console.log('🔍 Checking ARTLEE user accounts...\n')

  try {
    // Query users table for ARTLEE tenant
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_active, tenant_id')
      .eq('tenant_id', 'artlee')
      .order('email', { ascending: true })

    if (error) {
      console.error('❌ Error querying users:', error)
      return
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No ARTLEE users found in database')
      return
    }

    console.log(`✅ Found ${users.length} ARTLEE user(s):\n`)

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   Name: ${user.name || 'N/A'}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.is_active ? '✅' : '❌'}`)
      console.log(`   User ID: ${user.id}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Query failed:', error)
  }
}

// Run
checkArtleeUsers()
