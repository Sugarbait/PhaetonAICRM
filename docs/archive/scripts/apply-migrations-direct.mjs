#!/usr/bin/env node

/**
 * Apply Credential Storage Migrations (Direct Method)
 * ====================================================
 *
 * This script applies database migrations by executing SQL directly
 * through the Supabase SQL query endpoint. This method is more reliable
 * than trying to use RPC functions.
 *
 * Usage: node apply-migrations-direct.mjs
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.error('Please set it in your .env.local file')
  process.exit(1)
}

console.log('🚀 Direct Migration Application Method')
console.log('=' .repeat(60))
console.log('\nThis script will guide you through applying the migrations.')
console.log('\nMigration files to apply:')
console.log('1. 20251011000004_add_system_credentials_constraints.sql')
console.log('2. 20251011000002_fix_user_settings_api_columns.sql')
console.log('3. 20251011000003_fix_user_profiles_credential_columns.sql')

console.log('\n' + '='.repeat(60))
console.log('📋 RECOMMENDED APPROACH: Use Supabase SQL Editor')
console.log('='.repeat(60))

console.log('\nDue to RLS and permission complexities, the recommended approach is:')
console.log('\n1. Open Supabase Dashboard:')
console.log(`   https://app.supabase.com/project/cpkslvmydfdevdftieck/editor`)

console.log('\n2. Navigate to SQL Editor in the left sidebar')

console.log('\n3. Apply Migration 1: Add system_credentials constraints')
console.log('   Copy from: supabase/migrations/20251011000004_add_system_credentials_constraints.sql')
console.log('   Run in SQL Editor, then verify success message')

console.log('\n4. Apply Migration 2: Fix user_settings columns')
console.log('   Copy from: supabase/migrations/20251011000002_fix_user_settings_api_columns.sql')
console.log('   Run in SQL Editor, then verify success message')

console.log('\n5. Apply Migration 3: Fix user_profiles columns')
console.log('   Copy from: supabase/migrations/20251011000003_fix_user_profiles_credential_columns.sql')
console.log('   Run in SQL Editor, then verify success message')

console.log('\n6. Verify migrations were applied successfully:')
console.log('   node verify-database-schema.mjs')

console.log('\n' + '='.repeat(60))
console.log('📝 MIGRATION FILE CONTENTS')
console.log('='.repeat(60))

// Read and display each migration file
const migrations = [
  {
    name: 'Migration 1: Add system_credentials constraints',
    file: '20251011000004_add_system_credentials_constraints.sql'
  },
  {
    name: 'Migration 2: Fix user_settings columns',
    file: '20251011000002_fix_user_settings_api_columns.sql'
  },
  {
    name: 'Migration 3: Fix user_profiles columns',
    file: '20251011000003_fix_user_profiles_credential_columns.sql'
  }
]

for (const migration of migrations) {
  console.log(`\n\n${'='.repeat(60)}`)
  console.log(`${migration.name}`)
  console.log('='.repeat(60))

  try {
    const sqlPath = join(__dirname, 'supabase', 'migrations', migration.file)
    const sql = readFileSync(sqlPath, 'utf-8')
    console.log('\n' + sql)
  } catch (err) {
    console.error(`❌ Error reading ${migration.file}:`, err.message)
  }
}

console.log('\n\n' + '='.repeat(60))
console.log('✅ AFTER APPLYING MIGRATIONS')
console.log('='.repeat(60))

console.log('\n1. Run verification script:')
console.log('   node verify-database-schema.mjs')

console.log('\n2. If all checks pass, follow user instructions:')
console.log('   - Clear browser cache and localStorage')
console.log('   - Re-save API credentials in Settings')
console.log('   - Refresh page to verify credentials persist')
console.log('   - Test cross-device synchronization')

console.log('\n3. Monitor console for these success messages:')
console.log('   ✅ CloudCredentialService: Initialization completed successfully')
console.log('   📁 Phaeton AI - Storing valid credentials to cloud')
console.log('   ✅ Phaeton AI: Synced user credentials to cloud')

console.log('\n' + '='.repeat(60))
console.log('📖 FULL DOCUMENTATION')
console.log('='.repeat(60))
console.log('\nFor complete details, see: CREDENTIAL_STORAGE_FIX.md')
console.log('=' .repeat(60) + '\n')
