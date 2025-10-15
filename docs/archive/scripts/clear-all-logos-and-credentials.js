/**
 * Clear ALL logos and API credentials from ARTLEE
 * Ensures completely blank state for fresh start
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

async function clearAllLogosAndCredentials() {
  try {
    console.log('🧹 Clearing ALL logos and API credentials for ARTLEE...\n')

    // 1. Delete all user_settings for ARTLEE users (logos and API credentials stored here)
    console.log('📋 Step 1: Deleting user_settings for ARTLEE tenant...')
    const { data: artleeUsers, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', 'artlee')

    if (userError) {
      console.error('❌ Error fetching ARTLEE users:', userError.message)
    } else if (artleeUsers && artleeUsers.length > 0) {
      const artleeUserIds = artleeUsers.map(u => u.id)

      const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .in('user_id', artleeUserIds)

      if (settingsError) {
        console.error('❌ Error deleting user_settings:', settingsError.message)
      } else {
        console.log(`✅ Deleted user_settings for ${artleeUsers.length} ARTLEE user(s)`)
      }
    } else {
      console.log('ℹ️ No ARTLEE users found (database already clean)')
    }

    // 2. Check for any ARTLEE-specific logo records in company_logos table (if exists)
    console.log('\n📋 Step 2: Checking for company logo records...')
    const { data: logoRecords, error: logoError } = await supabase
      .from('company_logos')
      .select('*')
      .eq('tenant_id', 'artlee')

    if (logoError && logoError.code !== '42P01') { // 42P01 = table doesn't exist
      console.error('❌ Error checking company_logos:', logoError.message)
    } else if (logoRecords && logoRecords.length > 0) {
      const { error: deleteLogo } = await supabase
        .from('company_logos')
        .delete()
        .eq('tenant_id', 'artlee')

      if (deleteLogo) {
        console.error('❌ Error deleting logos:', deleteLogo.message)
      } else {
        console.log(`✅ Deleted ${logoRecords.length} logo record(s)`)
      }
    } else {
      console.log('ℹ️ No logo records found (or table doesn\'t exist)')
    }

    console.log('\n📋 Step 3: localStorage cleanup instructions:')
    console.log('━'.repeat(80))
    console.log('\n⚠️  IMPORTANT: Clear browser localStorage manually:')
    console.log('\n1. Open browser console at http://localhost:8001')
    console.log('2. Run these commands:\n')

    console.log('// Clear all logo data')
    console.log('localStorage.removeItem(\'company_logos\');')
    console.log('')

    console.log('// Clear all user settings (contains logos and API credentials)')
    console.log('Object.keys(localStorage).filter(k => k.startsWith(\'settings_\')).forEach(k => localStorage.removeItem(k));')
    console.log('')

    console.log('// Clear API credential storage')
    console.log('localStorage.removeItem(\'retell_credentials_backup\');')
    console.log('localStorage.removeItem(\'__emergencyRetellCredentials\');')
    console.log('localStorage.removeItem(\'__fallbackRetellConfig\');')
    console.log('localStorage.removeItem(\'__retellCredentialsBackup\');')
    console.log('')

    console.log('// Clear session storage')
    console.log('sessionStorage.clear();')
    console.log('')

    console.log('// Clear window memory')
    console.log('delete window.__retellCredentialsBackup;')
    console.log('')

    console.log('3. Hard refresh page (Ctrl+Shift+R)')
    console.log('4. All logos and API credentials should now be BLANK\n')

    console.log('━'.repeat(80))
    console.log('\n✅ Supabase cleanup complete!')
    console.log('🎨 After browser cleanup, ARTLEE will start with:')
    console.log('   - No logos (blank space on login)')
    console.log('   - No API credentials (empty fields)')
    console.log('   - No user settings')
    console.log('')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

clearAllLogosAndCredentials()
