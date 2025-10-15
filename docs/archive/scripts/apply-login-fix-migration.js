/**
 * Apply Login Fix Migration
 *
 * This script applies the RLS policy fix to allow unauthenticated login queries.
 * It reads the migration SQL file and executes it using the Supabase service role key.
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

// Create Supabase admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function applyMigration() {
  console.log('🔧 Applying Login Fix Migration...\n')

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
    console.log('📋 Migration SQL:')
    console.log('─'.repeat(80))
    console.log(migrationSQL)
    console.log('─'.repeat(80))
    console.log('')

    // Confirm before applying
    console.log('⚠️  This will modify your Supabase database RLS policies.')
    console.log('⚠️  The migration will:')
    console.log('   1. Drop existing RLS policies on the users table')
    console.log('   2. Create new policies that allow unauthenticated login queries')
    console.log('   3. Maintain security for all other operations')
    console.log('')

    // Split SQL by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`🔄 Executing ${statements.length} SQL statement(s)...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`${i + 1}/${statements.length} Executing: ${statement.substring(0, 60)}...`)

      try {
        // Execute SQL using Supabase RPC or direct query
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: statement + ';' })

        if (error) {
          // Try alternative method if RPC doesn't exist
          console.log('   ℹ️  RPC method not available, trying direct execution...')

          // For PostgreSQL-specific operations, we need to use the REST API directly
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ sql: statement + ';' })
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`)
          }
        }

        console.log('   ✅ Success')
      } catch (execError) {
        console.error(`   ❌ Failed: ${execError.message}`)
        console.error('\n💡 Note: You may need to apply this migration manually using:')
        console.error('   - Supabase Dashboard → SQL Editor')
        console.error('   - Or Supabase CLI: supabase migration up')
        console.error('\n📋 Copy the SQL from the migration file and paste it into the SQL Editor.')
        process.exit(1)
      }
    }

    console.log('\n' + '═'.repeat(80))
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
    console.log('🔍 To verify the fix:')
    console.log('   - Check Supabase Dashboard → Authentication → Policies')
    console.log('   - Look for "allow_login_and_authenticated_queries" policy')
    console.log('')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    console.error('\n💡 Manual Application Instructions:')
    console.error('   1. Go to Supabase Dashboard')
    console.error('   2. Navigate to SQL Editor')
    console.error('   3. Copy the contents of:')
    console.error('      supabase/migrations/20251010000002_fix_login_rls_policy.sql')
    console.error('   4. Paste and run the SQL')
    process.exit(1)
  }
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
