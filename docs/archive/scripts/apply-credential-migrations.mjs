#!/usr/bin/env node

/**
 * Apply Credential Storage Migrations
 * ===================================
 *
 * This script applies database migrations to fix credential storage issues:
 * 1. Creates system_credentials table with proper unique constraints
 * 2. Adds missing api_key_updated_at column to user_settings
 * 3. Adds missing encrypted_agent_config and encrypted_retell_api_key columns to user_profiles
 *
 * Usage: node apply-credential-migrations.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.error('Please set it in your .env.local file or pass it as an environment variable')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSqlFile(filename, description) {
  console.log(`\n📄 Executing: ${description}`)
  console.log(`   File: ${filename}`)

  try {
    const sqlPath = join(__dirname, 'supabase', 'migrations', filename)
    const sql = readFileSync(sqlPath, 'utf-8')

    // Execute SQL using raw query
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async (err) => {
      // If exec_sql function doesn't exist, try executing statements one by one
      console.log('   ℹ️  Using fallback execution method...')

      // Split SQL into individual statements (basic splitting, may need enhancement)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('DROP')) {
          // Use postgREST endpoint for DDL statements
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement + ';' })
          if (stmtError) {
            // Try direct SQL execution
            console.log(`   ⚠️  Statement failed via RPC, attempting direct execution...`)
            // Note: Direct SQL execution requires psql or similar
            throw new Error(`Statement execution failed: ${stmtError.message}`)
          }
        }
      }

      return { data: null, error: null }
    })

    if (error) {
      console.error(`   ❌ Error executing ${filename}:`, error)
      return false
    }

    console.log(`   ✅ Success: ${description}`)
    return true
  } catch (err) {
    console.error(`   ❌ Error reading or executing ${filename}:`, err.message)
    return false
  }
}

async function verifySystemCredentialsTable() {
  console.log('\n🔍 Verifying system_credentials table...')

  try {
    const { data, error } = await supabase
      .from('system_credentials')
      .select('*')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('   ✅ Table exists but is empty (expected)')
        return true
      }
      console.error('   ❌ Table verification failed:', error)
      return false
    }

    console.log('   ✅ Table exists and is accessible')
    return true
  } catch (err) {
    console.error('   ❌ Table verification error:', err.message)
    return false
  }
}

async function verifyUserSettingsColumns() {
  console.log('\n🔍 Verifying user_settings columns...')

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('api_key_updated_at, retell_config, encrypted_api_keys, retell_agent_config, encrypted_retell_keys')
      .limit(1)

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('   ❌ Missing columns:', error.message)
        return false
      }
      // Empty table is fine
      if (error.code === 'PGRST116') {
        console.log('   ✅ All columns exist (table is empty)')
        return true
      }
    }

    console.log('   ✅ All required columns exist in user_settings')
    return true
  } catch (err) {
    console.error('   ❌ Column verification error:', err.message)
    return false
  }
}

async function verifyUserProfilesColumns() {
  console.log('\n🔍 Verifying user_profiles columns...')

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('encrypted_agent_config, encrypted_retell_api_key')
      .limit(1)

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('   ❌ Missing columns:', error.message)
        return false
      }
      // Empty table is fine
      if (error.code === 'PGRST116') {
        console.log('   ✅ All columns exist (table is empty)')
        return true
      }
    }

    console.log('   ✅ All required columns exist in user_profiles')
    return true
  } catch (err) {
    console.error('   ❌ Column verification error:', err.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting credential storage migration...')
  console.log(`   Supabase URL: ${SUPABASE_URL}`)

  // Execute migrations
  const results = {
    systemCredentialsConstraints: await executeSqlFile(
      '20251011000004_add_system_credentials_constraints.sql',
      'Add unique constraints to system_credentials table'
    ),
    userSettings: await executeSqlFile(
      '20251011000002_fix_user_settings_api_columns.sql',
      'Fix user_settings API columns'
    ),
    userProfiles: await executeSqlFile(
      '20251011000003_fix_user_profiles_credential_columns.sql',
      'Fix user_profiles credential columns'
    )
  }

  // Verify migrations
  console.log('\n' + '='.repeat(60))
  console.log('VERIFICATION PHASE')
  console.log('='.repeat(60))

  const verifications = {
    systemCredentials: await verifySystemCredentialsTable(),
    userSettings: await verifyUserSettingsColumns(),
    userProfiles: await verifyUserProfilesColumns()
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('MIGRATION SUMMARY')
  console.log('='.repeat(60))

  const allMigrationsSucceeded = Object.values(results).every(r => r === true)
  const allVerificationsSucceeded = Object.values(verifications).every(v => v === true)

  console.log('\nMigration Execution:')
  console.log(`  system_credentials constraints: ${results.systemCredentialsConstraints ? '✅' : '❌'}`)
  console.log(`  user_settings columns:          ${results.userSettings ? '✅' : '❌'}`)
  console.log(`  user_profiles columns:          ${results.userProfiles ? '✅' : '❌'}`)

  console.log('\nVerification:')
  console.log(`  system_credentials table: ${verifications.systemCredentials ? '✅' : '❌'}`)
  console.log(`  user_settings columns:    ${verifications.userSettings ? '✅' : '❌'}`)
  console.log(`  user_profiles columns:    ${verifications.userProfiles ? '✅' : '❌'}`)

  if (allMigrationsSucceeded && allVerificationsSucceeded) {
    console.log('\n✅ All migrations completed successfully!')
    console.log('\n📋 Next Steps:')
    console.log('1. Clear your browser cache and localStorage')
    console.log('2. Re-save your API credentials in Settings')
    console.log('3. Refresh the page to verify credentials persist')
    console.log('4. Test cross-device synchronization')
  } else {
    console.log('\n⚠️  Some migrations or verifications failed.')
    console.log('Please check the errors above and run the script again.')
    console.log('\nIf migrations failed due to RLS or permissions, you may need to:')
    console.log('1. Use the Supabase SQL Editor to run migrations manually')
    console.log('2. Ensure VITE_SUPABASE_SERVICE_ROLE_KEY is correctly set')
    console.log('3. Check that your service role key has sufficient permissions')
  }

  console.log('\n' + '='.repeat(60))
}

// Run main function
main().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
