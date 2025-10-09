import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('Connecting to Supabase...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsers() {
  try {
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', 'artlee')

    console.log('\n=== USERS TABLE ===')
    if (usersError) {
      console.log('❌ Error:', usersError.message)
    } else {
      console.log(`✅ Found ${users.length} users in database`)
      if (users.length > 0) {
        console.log('\nUser details:')
        users.forEach((user, index) => {
          console.log(`\n${index + 1}. ${user.name || 'No name'} (${user.email})`)
          console.log(`   ID: ${user.id}`)
          console.log(`   Role: ${user.role}`)
          console.log(`   Active: ${user.is_active}`)
          console.log(`   Created: ${user.created_at}`)
        })
      } else {
        console.log('✅ Database is EMPTY - first user message should show')
      }
    }

    // Check user_profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('tenant_id', 'artlee')

    console.log('\n=== USER_PROFILES TABLE ===')
    if (profilesError) {
      console.log('❌ Error:', profilesError.message)
    } else {
      console.log(`✅ Found ${profiles.length} profiles`)
    }

    // Check user_settings table
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('tenant_id', 'artlee')

    console.log('\n=== USER_SETTINGS TABLE ===')
    if (settingsError) {
      console.log('❌ Error:', settingsError.message)
    } else {
      console.log(`✅ Found ${settings.length} settings records`)
    }

    console.log('\n=== SUMMARY ===')
    console.log(`Total users: ${users?.length || 0}`)
    console.log(`Total profiles: ${profiles?.length || 0}`)
    console.log(`Total settings: ${settings?.length || 0}`)

    if ((users?.length || 0) === 0) {
      console.log('\n✅ Database is completely empty - first user message SHOULD be visible')
    } else {
      console.log('\n⚠️ Users exist in database - first user message will NOT show')
    }

  } catch (error) {
    console.error('❌ Error checking users:', error.message)
  }
}

checkUsers()
