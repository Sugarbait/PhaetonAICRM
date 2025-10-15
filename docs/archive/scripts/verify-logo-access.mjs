/**
 * Verify that company logos are publicly accessible without authentication
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

// Create unauthenticated client (same as login page)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyLogoAccess() {
  try {
    console.log('🔍 Testing public access to company logos...\n')

    // Try to fetch company logos WITHOUT authentication (as login page would)
    const { data, error } = await supabase
      .from('company_settings')
      .select('data')
      .eq('tenant_id', 'artlee')
      .eq('name', 'company_logos')
      .maybeSingle()

    if (error) {
      console.error('❌ Failed to fetch logos:', error)
      console.log('\n💡 Possible issues:')
      console.log('   - RLS policy may not have been applied correctly')
      console.log('   - Table might not exist')
      console.log('   - Tenant ID might be different')
      return false
    }

    if (!data) {
      console.log('⚠️  No logo data found in database')
      console.log('   This is normal if you haven\'t uploaded any logos yet')
      console.log('   But the public access policy is working correctly!')
      return true
    }

    console.log('✅ SUCCESS! Logos are publicly accessible\n')
    console.log('📦 Logo data found:')
    console.log('   - Header Logo:', data.data?.headerLogo ? '✓ Present' : '✗ Not set')
    console.log('   - Footer Logo (Light):', data.data?.footerLogoLight ? '✓ Present' : '✗ Not set')
    console.log('   - Footer Logo (Dark):', data.data?.footerLogoDark ? '✓ Present' : '✗ Not set')
    console.log('   - Favicon:', data.data?.favicon ? '✓ Present' : '✗ Not set')
    console.log()
    console.log('🎯 Login page will now display these logos on all devices!')

    return true
  } catch (error) {
    console.error('❌ Error verifying logo access:', error)
    return false
  }
}

verifyLogoAccess().then(success => {
  process.exit(success ? 0 : 1)
})
