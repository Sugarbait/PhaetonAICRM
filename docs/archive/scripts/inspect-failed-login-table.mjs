/**
 * Inspect failed_login_attempts table schema
 * Run with: node inspect-failed-login-table.mjs
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

async function inspectTable() {
  console.log('🔍 Inspecting failed_login_attempts table schema...\n')

  try {
    // Try to query with only id field
    console.log('1️⃣ Testing basic SELECT...')
    const { data: basicData, error: basicError } = await supabaseAdmin
      .from('failed_login_attempts')
      .select('*')
      .limit(1)

    if (basicError) {
      console.log('❌ Basic select failed:', basicError.message)
      console.log('   Error code:', basicError.code)
      return
    }

    console.log('✅ Basic select works')
    console.log('   Sample row structure:', basicData && basicData[0] ? Object.keys(basicData[0]) : 'No rows')

    // Try insert with minimal data
    console.log('\n2️⃣ Testing INSERT with minimal fields...')
    const testEmail = `test-${Date.now()}@example.com`

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('failed_login_attempts')
      .insert({
        email: testEmail
      })
      .select()

    if (insertError) {
      console.log('⚠️  Insert failed:', insertError.message)
      console.log('   Error details:', JSON.stringify(insertError, null, 2))

      // Try with different field combinations
      console.log('\n3️⃣ Trying insert with timestamp field...')
      const { error: insertError2 } = await supabaseAdmin
        .from('failed_login_attempts')
        .insert({
          email: testEmail,
          timestamp: new Date().toISOString()
        })
        .select()

      if (insertError2) {
        console.log('⚠️  Also failed:', insertError2.message)
      } else {
        console.log('✅ Insert worked with "timestamp" field instead of "attempted_at"')
      }
    } else {
      console.log('✅ Insert successful!')
      console.log('   Inserted record:', insertData)

      // Clean up
      await supabaseAdmin
        .from('failed_login_attempts')
        .delete()
        .eq('email', testEmail)
    }

    // Query PostgreSQL information schema for table structure
    console.log('\n4️⃣ Checking actual database schema...')
    const { data: schemaData, error: schemaError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'failed_login_attempts'
          ORDER BY ordinal_position;
        `
      })

    if (schemaError && schemaError.code === '42883') {
      console.log('⚠️  Cannot query schema directly (exec_sql not available)')
      console.log('   This is normal - schema inspection requires direct database access')
    } else if (schemaError) {
      console.log('⚠️  Schema query error:', schemaError.message)
    } else {
      console.log('✅ Database schema:')
      console.log(schemaData)
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

console.log('═'.repeat(80))
console.log('🔬 FAILED LOGIN ATTEMPTS TABLE SCHEMA INSPECTION')
console.log('═'.repeat(80))
console.log('')

inspectTable()
  .then(() => {
    console.log('\n═'.repeat(80))
    console.log('✅ Inspection complete')
    console.log('═'.repeat(80))
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Script failed:', err)
    process.exit(1)
  })
