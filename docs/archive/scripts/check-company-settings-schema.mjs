#!/usr/bin/env node

/**
 * Check Actual company_settings Table Schema
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Checking company_settings table schema...\n')

// Get actual table structure
const { data, error } = await supabase
  .from('company_settings')
  .select('*')
  .limit(1)

if (error) {
  console.error('❌ Error querying table:', error.message)
  process.exit(1)
}

console.log('✅ Table exists!')
console.log('\nActual columns in company_settings:')

if (data && data.length > 0) {
  const columns = Object.keys(data[0])
  columns.forEach(col => {
    console.log(`   - ${col}`)
  })
} else {
  console.log('   (Table is empty, trying schema query...)')

  // Try raw SQL query
  const { data: schemaData, error: schemaError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'company_settings'
        ORDER BY ordinal_position
      `
    })

  if (schemaError) {
    console.log('   Cannot determine columns - table may be empty')
    console.log('   Listing what we expect:')
    console.log('   Expected: id, tenant_id, header_logo, favicon, category, created_at, updated_at')
  }
}

console.log('\nRequired columns for logo upload:')
console.log('   - tenant_id (TEXT)')
console.log('   - header_logo (TEXT)')
console.log('   - favicon (TEXT)')
console.log('   - category (TEXT)')
console.log('')
