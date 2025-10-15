#!/usr/bin/env node

/**
 * Verify Database Schema for Credential Storage
 * ==============================================
 *
 * This script checks the current state of the database schema
 * to identify missing tables and columns that are causing credential
 * storage issues.
 *
 * Usage: node verify-database-schema.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cpkslvmydfdevdftieck.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.error('Please set it in your .env.local file')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkTable(tableName) {
  console.log(`\n🔍 Checking table: ${tableName}`)
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`   ✅ Table exists (empty)`)
        return { exists: true, error: null }
      }
      if (error.message.includes('does not exist')) {
        console.log(`   ❌ Table does NOT exist`)
        return { exists: false, error: error.message }
      }
      console.log(`   ⚠️  Table check returned error: ${error.message}`)
      return { exists: true, error: error.message }
    }

    console.log(`   ✅ Table exists (${data?.length || 0} rows)`)
    return { exists: true, error: null }
  } catch (err) {
    console.log(`   ❌ Error checking table: ${err.message}`)
    return { exists: false, error: err.message }
  }
}

async function checkColumns(tableName, columns) {
  console.log(`\n🔍 Checking columns in ${tableName}:`)
  const results = {}

  for (const column of columns) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select(column)
        .limit(1)

      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log(`   ❌ Column '${column}' does NOT exist`)
          results[column] = { exists: false, error: error.message }
        } else if (error.code === 'PGRST116') {
          console.log(`   ✅ Column '${column}' exists`)
          results[column] = { exists: true, error: null }
        } else {
          console.log(`   ⚠️  Column '${column}' check returned error: ${error.message}`)
          results[column] = { exists: false, error: error.message }
        }
      } else {
        console.log(`   ✅ Column '${column}' exists`)
        results[column] = { exists: true, error: null }
      }
    } catch (err) {
      console.log(`   ❌ Error checking column '${column}': ${err.message}`)
      results[column] = { exists: false, error: err.message }
    }
  }

  return results
}

async function testCredentialStorage() {
  console.log('\n🔍 Testing credential storage operations...')

  const testUserId = '166b5086-5ec5-49f3-9eff-68f75d0c8e79' // pierre@phaetonai.com

  // Test 1: Try to store in system_credentials
  console.log('\n1️⃣  Testing system_credentials table...')
  try {
    const { error } = await supabase
      .from('system_credentials')
      .upsert({
        credential_type: 'user_override',
        api_key: 'test_key',
        call_agent_id: 'test_call_agent',
        sms_agent_id: 'test_sms_agent',
        tenant_id: 'phaeton_ai',
        user_id: testUserId,
        is_active: true
      }, {
        onConflict: 'user_id,credential_type'
      })

    if (error) {
      console.log(`   ❌ Storage failed: ${error.message}`)
      if (error.code === '42P10') {
        console.log('   💡 Issue: Missing unique constraint for ON CONFLICT')
      }
      return false
    }

    console.log('   ✅ Storage successful')
    return true
  } catch (err) {
    console.log(`   ❌ Storage error: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Verifying Database Schema for Credential Storage')
  console.log(`   Supabase URL: ${SUPABASE_URL}`)
  console.log(`   User: pierre@phaetonai.com`)
  console.log('='.repeat(60))

  // Check tables
  const tables = {
    system_credentials: await checkTable('system_credentials'),
    user_settings: await checkTable('user_settings'),
    user_profiles: await checkTable('user_profiles')
  }

  // Check user_settings columns
  const userSettingsColumns = await checkColumns('user_settings', [
    'api_key_updated_at',
    'retell_config',
    'encrypted_api_keys',
    'retell_agent_config',
    'encrypted_retell_keys'
  ])

  // Check user_profiles columns
  const userProfilesColumns = await checkColumns('user_profiles', [
    'encrypted_agent_config',
    'encrypted_retell_api_key'
  ])

  // Test credential storage if table exists
  let storageTest = null
  if (tables.system_credentials.exists) {
    storageTest = await testCredentialStorage()
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(60))

  console.log('\n📋 Tables:')
  console.log(`  system_credentials: ${tables.system_credentials.exists ? '✅ Exists' : '❌ Missing'}`)
  console.log(`  user_settings:      ${tables.user_settings.exists ? '✅ Exists' : '❌ Missing'}`)
  console.log(`  user_profiles:      ${tables.user_profiles.exists ? '✅ Exists' : '❌ Missing'}`)

  console.log('\n📋 user_settings columns:')
  Object.entries(userSettingsColumns).forEach(([col, result]) => {
    console.log(`  ${col}: ${result.exists ? '✅ Exists' : '❌ Missing'}`)
  })

  console.log('\n📋 user_profiles columns:')
  Object.entries(userProfilesColumns).forEach(([col, result]) => {
    console.log(`  ${col}: ${result.exists ? '✅ Exists' : '❌ Missing'}`)
  })

  if (storageTest !== null) {
    console.log('\n📋 Credential Storage Test:')
    console.log(`  system_credentials write: ${storageTest ? '✅ Working' : '❌ Failed'}`)
  }

  // Determine what needs to be fixed
  console.log('\n' + '='.repeat(60))
  console.log('🔧 REQUIRED FIXES')
  console.log('='.repeat(60))

  const fixes = []

  if (!tables.system_credentials.exists) {
    fixes.push('❌ Create system_credentials table with proper schema')
  } else if (storageTest === false) {
    fixes.push('❌ Fix system_credentials table (missing unique constraints)')
  }

  if (!userSettingsColumns.api_key_updated_at?.exists) {
    fixes.push('❌ Add api_key_updated_at column to user_settings')
  }
  if (!userSettingsColumns.retell_config?.exists) {
    fixes.push('❌ Add retell_config column to user_settings')
  }
  if (!userSettingsColumns.encrypted_api_keys?.exists) {
    fixes.push('❌ Add encrypted_api_keys column to user_settings')
  }
  if (!userSettingsColumns.retell_agent_config?.exists) {
    fixes.push('❌ Add retell_agent_config column to user_settings')
  }
  if (!userSettingsColumns.encrypted_retell_keys?.exists) {
    fixes.push('❌ Add encrypted_retell_keys column to user_settings')
  }

  if (!userProfilesColumns.encrypted_agent_config?.exists) {
    fixes.push('❌ Add encrypted_agent_config column to user_profiles')
  }
  if (!userProfilesColumns.encrypted_retell_api_key?.exists) {
    fixes.push('❌ Add encrypted_retell_api_key column to user_profiles')
  }

  if (fixes.length === 0) {
    console.log('\n✅ All schema requirements are met!')
    console.log('   No migrations needed.')
  } else {
    console.log('\n⚠️  Schema issues found:')
    fixes.forEach(fix => console.log(`   ${fix}`))
    console.log('\n📝 To fix these issues, run:')
    console.log('   node apply-credential-migrations.mjs')
  }

  console.log('\n' + '='.repeat(60))
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
