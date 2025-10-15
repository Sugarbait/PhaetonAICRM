/**
 * Apply public logo access migration to Supabase
 * This allows company logos to be displayed on the login page without authentication
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🔄 Applying public logo access migration...\n')

    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251009000002_public_logo_access.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration SQL:')
    console.log('─'.repeat(80))
    console.log(migrationSQL)
    console.log('─'.repeat(80))
    console.log()

    // Execute the migration
    console.log('⚡ Executing migration...')
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('❌ Migration failed:', error)
      console.log('\n💡 Alternative: Copy the SQL above and run it manually in Supabase SQL Editor')
      process.exit(1)
    }

    console.log('✅ Migration applied successfully!')
    console.log()
    console.log('🎯 Changes applied:')
    console.log('   ✓ Company logos are now publicly readable (no authentication required)')
    console.log('   ✓ Only super users can create/update/delete company settings')
    console.log('   ✓ Login page will now display logos for all users')
    console.log()

  } catch (error) {
    console.error('❌ Error applying migration:', error)
    console.log('\n💡 Manual Steps:')
    console.log('   1. Go to your Supabase dashboard: https://supabase.com/dashboard')
    console.log('   2. Navigate to SQL Editor')
    console.log('   3. Copy the migration SQL from: supabase/migrations/20251009000002_public_logo_access.sql')
    console.log('   4. Paste and run the SQL')
    process.exit(1)
  }
}

applyMigration()
