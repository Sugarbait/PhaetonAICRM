#!/usr/bin/env node

/**
 * Check actual RLS policies in database
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Checking RLS Policies for failed_login_attempts...\n')

// Query pg_policies to see actual policies
const { data, error } = await supabase
  .rpc('exec_sql', {
    query: `
      SELECT
        policyname,
        cmd,
        roles,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'failed_login_attempts'
      ORDER BY policyname;
    `
  })

if (error) {
  console.log('Cannot query policies directly.')
  console.log('Trying alternative approach...\n')

  // Try to check if RLS is enabled
  console.log('Checking if RLS is enabled on table...')
  console.log('(This requires manual verification in Supabase Dashboard)')
  console.log('\nTo check manually:')
  console.log('1. Go to Table Editor')
  console.log('2. Click on failed_login_attempts table')
  console.log('3. Click "Edit table" (top right)')
  console.log('4. Check "Enable Row Level Security" checkbox')
  console.log('5. Go to Policies tab')
  console.log('6. Verify policies exist for "anon" role')
} else {
  console.log('Current policies:')
  console.log(data)
}

console.log('\n\n🔧 RECOMMENDED ACTION:')
console.log('Since policies aren\'t working via SQL, try this:')
console.log('\n1. Go to: https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/editor')
console.log('2. Click "failed_login_attempts" table')
console.log('3. Click "..." menu → "Edit table"')
console.log('4. **UNCHECK** "Enable Row Level Security"')
console.log('5. Click "Save"')
console.log('\nThis will disable RLS entirely (less secure but will work)')
console.log('Or create policies via Dashboard UI (more secure)')
console.log('')
