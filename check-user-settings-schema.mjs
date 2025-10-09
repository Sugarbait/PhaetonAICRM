/**
 * Check user_settings table schema
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

async function checkSettings() {
  console.log('🔍 Checking user_settings table...\n')

  try {
    const userId = 'd4ca7563-c542-44b4-bb9c-f4d8fb5ab71a'

    // Check if settings exist for this user
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  No settings found for user')
        console.log('📋 Let me check what columns are available...\n')

        // Try to get any record to see schema
        const { data: anyData, error: anyError } = await supabase
          .from('user_settings')
          .select('*')
          .limit(1)

        if (anyError) {
          console.error('❌ Error:', anyError)
          return
        }

        if (anyData && anyData.length > 0) {
          console.log('✅ Available columns in user_settings:')
          const columns = Object.keys(anyData[0])
          columns.forEach(col => {
            console.log(`   - ${col}`)
          })
        } else {
          console.log('⚠️  user_settings table is empty')
        }
        return
      }
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Found settings for user:')
    console.log(JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('❌ Failed:', error)
  }
}

checkSettings()
