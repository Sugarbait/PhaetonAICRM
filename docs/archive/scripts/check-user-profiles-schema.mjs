/**
 * Check user_profiles table schema
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

async function checkSchema() {
  console.log('🔍 Checking user_profiles table schema...\n')

  try {
    // Try to get one record to see available columns
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error querying table:', error)
      return
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No records found in user_profiles table')
      return
    }

    console.log('✅ Available columns in user_profiles:')
    const columns = Object.keys(data[0])
    columns.forEach(col => {
      console.log(`   - ${col}`)
    })

  } catch (error) {
    console.error('❌ Query failed:', error)
  }
}

checkSchema()
