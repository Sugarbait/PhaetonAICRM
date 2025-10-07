// Test email settings cloud sync
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cpkslvmydfdevdftieck.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEmailSettings() {
  console.log('🔍 Checking user_settings table for email_notifications column...\n')

  // Get current user from localStorage (you'll need to replace this with actual user ID)
  const userId = 'pierre@phaetonai.com' // Replace with actual user ID

  // Check if email_notifications column exists
  const { data, error } = await supabase
    .from('user_settings')
    .select('user_id, email_notifications')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('❌ Error:', error.message)
    console.log('\n📝 The email_notifications column might not exist in user_settings table')
    console.log('We need to add it with a migration.')
    return
  }

  console.log('✅ Query successful!')
  console.log('User ID:', data.user_id)
  console.log('Email Notifications:', JSON.stringify(data.email_notifications, null, 2))
}

testEmailSettings()