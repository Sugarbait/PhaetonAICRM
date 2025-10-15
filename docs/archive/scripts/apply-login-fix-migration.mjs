/**
 * Apply Login Fix Migration
 *
 * This script applies the RLS policy fix to allow unauthenticated login queries.
 * Uses Supabase service role key to execute SQL directly.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🔧 Applying Login Fix Migration...\n')
console.log('📊 Configuration:')
console.log(`   Supabase URL: ${SUPABASE_URL}`)
console.log(`   Using service role key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`)
console.log('')

// Create Supabase admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function applyMigration() {
  try {
    // Read migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251010000002_fix_login_rls_policy.sql')
    console.log('📄 Reading migration file:', migrationPath)

    let migrationSQL
    try {
      migrationSQL = readFileSync(migrationPath, 'utf8')
    } catch (readError) {
      console.error('❌ Failed to read migration file:', readError.message)
      console.error('\n💡 Make sure the migration file exists at:')
      console.error('   supabase/migrations/20251010000002_fix_login_rls_policy.sql')
      process.exit(1)
    }

    console.log('✅ Migration file loaded successfully\n')

    // Extract SQL statements (ignore comments and empty lines)
    const statements = migrationSQL
      .split('\n')
      .filter(line => {
        const trimmed = line.trim()
        return trimmed && !trimmed.startsWith('--')
      })
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    console.log(`📋 Found ${statements.length} SQL statement(s) to execute\n`)
    console.log('⚠️  This will modify your Supabase database RLS policies.')
    console.log('⚠️  Changes:')
    console.log('   • Drop existing restrictive policies')
    console.log('   • Create policies that allow unauthenticated login queries')
    console.log('   • Maintain security for write operations\n')

    // Use REST API with SQL Editor endpoint
    console.log('🔄 Executing SQL via Supabase REST API...\n')

    // Combine all statements into one SQL block for execution
    const fullSQL = statements.join(';\n') + ';'

    // Execute using Supabase's REST API directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: fullSQL })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ REST API execution failed:', response.status, errorText)
      console.error('\n💡 Note: Direct SQL execution via REST API may not be available.')
      console.error('   Please apply the migration manually using one of these methods:\n')
      printManualInstructions(fullSQL)
      process.exit(1)
    }

    console.log('✅ SQL execution completed via REST API\n')

    console.log('═'.repeat(80))
    console.log('✅ SUCCESS - Migration applied successfully!')
    console.log('═'.repeat(80))
    console.log('')
    console.log('📊 What changed:')
    console.log('   ✓ RLS policies on users table updated')
    console.log('   ✓ Unauthenticated login queries now allowed')
    console.log('   ✓ Security maintained for all other operations')
    console.log('')
    console.log('🧪 Next steps:')
    console.log('   1. Clear browser cache and localStorage')
    console.log('   2. Try logging in with test@test.com')
    console.log('   3. Check console logs for successful authentication')
    console.log('   4. Verify you can access the dashboard')
    console.log('')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    console.error('\n💡 The automatic migration failed.')
    const migrationSQL = readFileSync(
      join(__dirname, 'supabase', 'migrations', '20251010000002_fix_login_rls_policy.sql'),
      'utf8'
    )
    printManualInstructions(migrationSQL)
    process.exit(1)
  }
}

function printManualInstructions(sql) {
  console.error('\n📋 MANUAL APPLICATION INSTRUCTIONS:')
  console.error('─'.repeat(80))
  console.error('\nMethod 1: Supabase Dashboard (Recommended)')
  console.error('   1. Go to https://supabase.com/dashboard')
  console.error('   2. Select your project')
  console.error('   3. Navigate to SQL Editor')
  console.error('   4. Click "New Query"')
  console.error('   5. Copy the SQL below and paste it')
  console.error('   6. Click "Run"\n')
  console.error('\nMethod 2: Supabase CLI (if installed)')
  console.error('   Run: supabase migration up\n')
  console.error('\n📄 SQL TO COPY:')
  console.error('─'.repeat(80))
  console.error(sql)
  console.error('─'.repeat(80))
  console.error('')
}

// Run the migration
console.log('🚀 Starting Login Fix Migration Application\n')
applyMigration()
  .then(() => {
    console.log('✨ Migration application complete!')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Migration application failed:', err)
    process.exit(1)
  })
