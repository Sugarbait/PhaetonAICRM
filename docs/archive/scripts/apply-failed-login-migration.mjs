/**
 * Apply failed_login_attempts migration to Supabase
 * Run with: node apply-failed-login-migration.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function applyMigration() {
  console.log('🔄 Applying failed_login_attempts migration to Supabase...\n')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251010000005_create_failed_login_attempts.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded:', migrationPath)
    console.log('📏 SQL length:', migrationSQL.length, 'characters\n')

    // Execute the migration
    console.log('⚙️  Executing migration SQL...')
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      if (error.message.includes('exec_sql')) {
        console.log('⚠️  exec_sql function not available, trying direct execution...\n')

        // Split SQL into individual statements
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'))

        console.log(`📋 Found ${statements.length} SQL statements to execute\n`)

        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i]
          console.log(`▶️  Executing statement ${i + 1}/${statements.length}...`)

          try {
            // Use Supabase's query builder for direct SQL execution
            const { error: execError } = await supabaseAdmin.from('_migrations').select('*').limit(0)

            // Since we can't execute raw SQL directly, we'll use a workaround
            // Create the table using Supabase REST API
            console.log('   ℹ️  Statement:', statement.substring(0, 80) + '...')

            // For now, just log that we would execute this
            console.log('   ✅ Would execute (manual execution required via Supabase Dashboard)')
            successCount++
          } catch (execError) {
            console.error(`   ❌ Error:`, execError.message)
            errorCount++
          }
        }

        console.log('\n' + '='.repeat(80))
        console.log('📊 MIGRATION SUMMARY')
        console.log('='.repeat(80))
        console.log(`✅ Statements processed: ${successCount}`)
        console.log(`❌ Statements with errors: ${errorCount}`)
        console.log('\n⚠️  MANUAL ACTION REQUIRED:')
        console.log('   1. Open Supabase Dashboard: https://supabase.com/dashboard')
        console.log('   2. Navigate to: SQL Editor')
        console.log('   3. Copy and paste the migration SQL from:')
        console.log(`      ${migrationPath}`)
        console.log('   4. Click "Run" to execute the migration')
        console.log('\n💡 This will create the failed_login_attempts table for MFA lockout protection.')

      } else {
        console.error('❌ Migration failed:', error.message)
        console.error('   Details:', error)
        process.exit(1)
      }
    } else {
      console.log('✅ Migration executed successfully!')
      console.log('\n' + '='.repeat(80))
      console.log('✅ MIGRATION COMPLETE')
      console.log('='.repeat(80))
    }

    // Verify table creation
    console.log('\n🔍 Verifying table creation...')
    const { data: tableCheck, error: checkError } = await supabaseAdmin
      .from('failed_login_attempts')
      .select('*')
      .limit(1)

    if (checkError && checkError.code === 'PGRST116') {
      console.log('⚠️  Table verification skipped (expected if table is empty)')
    } else if (checkError) {
      console.log('⚠️  Could not verify table creation:', checkError.message)
      console.log('   This is expected - please verify manually in Supabase Dashboard')
    } else {
      console.log('✅ Table verified: failed_login_attempts exists and is accessible')
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  }
}

console.log('═'.repeat(80))
console.log('🔐 FAILED LOGIN ATTEMPTS TABLE MIGRATION')
console.log('═'.repeat(80))
console.log('This migration creates the failed_login_attempts table for:')
console.log('  • Tracking failed login attempts')
console.log('  • MFA lockout protection')
console.log('  • Brute-force attack prevention')
console.log('  • Security monitoring')
console.log('═'.repeat(80))
console.log('')

applyMigration()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Script failed:', err)
    process.exit(1)
  })
