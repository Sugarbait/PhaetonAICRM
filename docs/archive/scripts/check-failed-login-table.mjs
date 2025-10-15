/**
 * Check if failed_login_attempts table exists in Supabase
 * Run with: node check-failed-login-table.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkTable() {
  console.log('🔍 Checking failed_login_attempts table in Supabase...\n')

  try {
    // Try to select from the table
    const { data, error, count } = await supabaseAdmin
      .from('failed_login_attempts')
      .select('*', { count: 'exact', head: false })
      .limit(5)

    if (error) {
      console.log('❌ Table does NOT exist or is not accessible')
      console.log('   Error code:', error.code)
      console.log('   Error message:', error.message)
      console.log('\n💡 You need to create the table using the migration SQL')
      console.log('   See: HOSTINGER_FIX_INSTRUCTIONS.md')
      return false
    }

    console.log('✅ Table EXISTS and is accessible!')
    console.log(`   Total records: ${count || 0}`)

    if (data && data.length > 0) {
      console.log('\n📋 Sample records:')
      data.forEach((record, i) => {
        console.log(`   ${i + 1}. Email: ${record.email}`)
        console.log(`      Attempted: ${record.attempted_at}`)
        console.log(`      Reason: ${record.reason || 'N/A'}`)
      })
    } else {
      console.log('   (Table is empty - no failed login attempts recorded yet)')
    }

    // Try to insert a test record to verify permissions
    console.log('\n🧪 Testing insert permissions...')
    const { error: insertError } = await supabaseAdmin
      .from('failed_login_attempts')
      .insert({
        email: 'test@example.com',
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        reason: 'Permission test',
        attempted_at: new Date().toISOString()
      })

    if (insertError) {
      console.log('⚠️  Insert test failed:', insertError.message)
      console.log('   This may indicate RLS policy issues')
    } else {
      console.log('✅ Insert permissions verified')

      // Clean up test record
      await supabaseAdmin
        .from('failed_login_attempts')
        .delete()
        .eq('email', 'test@example.com')
        .eq('reason', 'Permission test')

      console.log('   (Test record cleaned up)')
    }

    return true
  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    return false
  }
}

console.log('═'.repeat(80))
console.log('🔐 FAILED LOGIN ATTEMPTS TABLE STATUS CHECK')
console.log('═'.repeat(80))
console.log('')

checkTable()
  .then((exists) => {
    console.log('\n' + '═'.repeat(80))
    if (exists) {
      console.log('✅ RESULT: Table is ready to use!')
      console.log('   The Hostinger error should be fixed.')
    } else {
      console.log('❌ RESULT: Table needs to be created')
      console.log('   Follow instructions in HOSTINGER_FIX_INSTRUCTIONS.md')
    }
    console.log('═'.repeat(80))
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Script failed:', err)
    process.exit(1)
  })
