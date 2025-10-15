/**
 * Test if Supabase Admin client is properly configured
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Checking Supabase Admin Configuration...\n')

console.log('Environment Variables:')
console.log('  VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `✓ Set (${supabaseAnonKey.substring(0, 20)}...)` : '✗ Missing')
console.log('  VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? `✓ Set (${supabaseServiceRoleKey.substring(0, 20)}...)` : '✗ Missing')
console.log()

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables!')
  console.log('\n💡 To fix this:')
  console.log('   1. Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env.local file')
  console.log('   2. Get the service role key from your Supabase dashboard:')
  console.log('      https://supabase.com/dashboard → Settings → API → service_role key')
  process.exit(1)
}

// Test admin client
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('✅ Admin client created successfully!')
console.log()

// Test write access with admin client
console.log('🧪 Testing admin write access to company_settings...')

try {
  const testData = {
    tenant_id: 'artlee',
    name: 'test_write_check',
    category: 'test',
    data: { test: true }
  }

  // Try to insert test record
  const { data, error } = await adminClient
    .from('company_settings')
    .insert(testData)
    .select()

  if (error) {
    console.error('❌ Admin write test failed:', error.message)
    console.log('\n💡 This means the admin client cannot write to the database.')
    console.log('   Possible issues:')
    console.log('   - Service role key is incorrect')
    console.log('   - RLS policies are blocking even the admin client')
    process.exit(1)
  }

  console.log('✅ Admin client can write to database!')
  console.log('   Inserted test record:', data)

  // Clean up test record
  await adminClient
    .from('company_settings')
    .delete()
    .eq('name', 'test_write_check')

  console.log('✅ Cleanup complete')
  console.log()
  console.log('🎯 Admin client is working correctly!')
  console.log('   The logo upload should now work with admin client.')

} catch (error) {
  console.error('❌ Test failed:', error)
  process.exit(1)
}
