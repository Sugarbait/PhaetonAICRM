#!/usr/bin/env node

/**
 * Diagnose Logo Upload Issues
 * Checks database schema and storage bucket configuration
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Diagnosing Logo Upload Issues...\n')
console.log('=' .repeat(60))

// Test 1: Check company_settings table schema
console.log('\n📋 TEST 1: Checking company_settings table schema')
console.log('-'.repeat(60))

try {
  // Query information_schema to check columns
  const { data: columns, error: schemaError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'company_settings')

  if (schemaError) {
    console.error('❌ Failed to query schema:', schemaError.message)
  } else if (!columns || columns.length === 0) {
    console.error('❌ company_settings table does not exist!')
    console.log('\n🔧 Solution: Run migration 20251010000007_fix_company_logos_upload.sql')
  } else {
    console.log('✅ company_settings table exists')
    console.log('\nColumns found:')
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`)
    })

    // Check for category column
    const hasCategory = columns.some(col => col.column_name === 'category')
    if (hasCategory) {
      console.log('\n✅ category column EXISTS - Schema is correct')
    } else {
      console.log('\n❌ category column MISSING - This is the problem!')
      console.log('🔧 Solution: Run migration 20251010000007_fix_company_logos_upload.sql')
    }
  }
} catch (err) {
  console.error('❌ Error checking schema:', err.message)
}

// Test 2: Check storage bucket
console.log('\n\n📦 TEST 2: Checking company-logos storage bucket')
console.log('-'.repeat(60))

try {
  const { data: buckets, error: bucketError } = await supabase
    .storage
    .listBuckets()

  if (bucketError) {
    console.error('❌ Failed to list buckets:', bucketError.message)
  } else {
    const companyLogosBucket = buckets.find(b => b.id === 'company-logos')

    if (companyLogosBucket) {
      console.log('✅ company-logos bucket EXISTS')
      console.log(`   - Public: ${companyLogosBucket.public}`)
      console.log(`   - Created: ${companyLogosBucket.created_at}`)
    } else {
      console.log('❌ company-logos bucket DOES NOT EXIST')
      console.log('🔧 Solution: Run migration 20251010000007_fix_company_logos_upload.sql')
    }
  }
} catch (err) {
  console.error('❌ Error checking bucket:', err.message)
}

// Test 3: Test storage upload (simulated)
console.log('\n\n🔐 TEST 3: Checking storage RLS policies')
console.log('-'.repeat(60))

try {
  // Try to upload a tiny test file using authenticated client
  const testFileName = `test_upload_${Date.now()}.txt`
  const testContent = 'test'

  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('company-logos')
    .upload(testFileName, testContent, {
      contentType: 'text/plain'
    })

  if (uploadError) {
    if (uploadError.message.includes('row-level security')) {
      console.error('❌ RLS Policy blocking uploads!')
      console.error('   Error:', uploadError.message)
      console.log('\n🔧 Solution: Run migration 20251010000007_fix_company_logos_upload.sql')
      console.log('   This will create permissive upload policies')
    } else if (uploadError.message.includes('Bucket not found')) {
      console.error('❌ Bucket does not exist!')
      console.log('\n🔧 Solution: Run migration 20251010000007_fix_company_logos_upload.sql')
    } else {
      console.error('❌ Upload failed:', uploadError.message)
    }
  } else {
    console.log('✅ Storage upload SUCCESSFUL')
    console.log(`   - File: ${uploadData.path}`)

    // Clean up test file
    await supabase
      .storage
      .from('company-logos')
      .remove([testFileName])

    console.log('✅ Test file cleaned up')
    console.log('\n🎉 Storage RLS policies are configured correctly!')
  }
} catch (err) {
  console.error('❌ Error testing upload:', err.message)
}

// Test 4: Test company_settings insert
console.log('\n\n💾 TEST 4: Testing company_settings insert')
console.log('-'.repeat(60))

try {
  const testData = {
    tenant_id: 'test_tenant_' + Date.now(),
    header_logo: 'test_logo.png',
    favicon: 'test_favicon.png',
    category: 'branding'
  }

  const { data: insertData, error: insertError } = await supabase
    .from('company_settings')
    .insert(testData)
    .select()

  if (insertError) {
    if (insertError.message.includes('category')) {
      console.error('❌ category column missing!')
      console.error('   Error:', insertError.message)
      console.log('\n🔧 Solution: Run migration 20251010000007_fix_company_logos_upload.sql')
    } else if (insertError.message.includes('row-level security')) {
      console.error('❌ RLS Policy blocking inserts!')
      console.error('   Error:', insertError.message)
      console.log('\n🔧 Solution: Run migration 20251010000007_fix_company_logos_upload.sql')
    } else {
      console.error('❌ Insert failed:', insertError.message)
    }
  } else {
    console.log('✅ company_settings insert SUCCESSFUL')
    console.log(`   - Record ID: ${insertData[0].id}`)

    // Clean up test record
    await supabase
      .from('company_settings')
      .delete()
      .eq('tenant_id', testData.tenant_id)

    console.log('✅ Test record cleaned up')
    console.log('\n🎉 Database schema and RLS policies are correct!')
  }
} catch (err) {
  console.error('❌ Error testing insert:', err.message)
}

// Summary
console.log('\n\n' + '='.repeat(60))
console.log('📊 DIAGNOSIS SUMMARY')
console.log('='.repeat(60))

console.log('\nTo fix all issues:')
console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard')
console.log('2. Navigate to SQL Editor')
console.log('3. Run migration: supabase/migrations/20251010000007_fix_company_logos_upload.sql')
console.log('4. Re-run this diagnostic script to verify')
console.log('\nFull instructions: FIX_LOGO_UPLOAD_ERRORS.md')
console.log('')
