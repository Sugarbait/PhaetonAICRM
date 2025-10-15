import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Supabase Key:', supabaseKey ? 'Found (length: ' + (supabaseKey?.length || 0) + ')' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    // 1. Check if failed_login_attempts table exists
    console.log('\n=== Checking failed_login_attempts table ===');
    const { data: tableData, error: tableError } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Table error:', tableError.message);
      console.log('Table may not exist or RLS is blocking access');
    } else {
      console.log('✅ Table exists!');
      console.log('Sample data:', tableData);
    }

    // 2. Query for robertdanvill800@gmail.com
    console.log('\n=== Checking records for robertdanvill800@gmail.com ===');
    const { data: userRecords, error: userError } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('email', 'robertdanvill800@gmail.com')
      .order('attempted_at', { ascending: false });

    if (userError) {
      console.log('❌ Query error:', userError.message);
    } else {
      console.log('✅ Found', userRecords?.length || 0, 'records');
      if (userRecords && userRecords.length > 0) {
        console.log('Records:', JSON.stringify(userRecords, null, 2));
      }
    }

    // 3. Query all records to see what's there
    console.log('\n=== All failed login attempts (last 10) ===');
    const { data: allRecords, error: allError } = await supabase
      .from('failed_login_attempts')
      .select('email, attempted_at, reason')
      .order('attempted_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.log('❌ Query error:', allError.message);
    } else {
      console.log('✅ All records:', JSON.stringify(allRecords, null, 2));
    }

    // 4. Check the table schema
    console.log('\n=== Checking table schema ===');
    const { data: schema, error: schemaError } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .limit(0);

    if (schemaError) {
      console.log('❌ Schema error:', schemaError.message);
    } else {
      console.log('✅ Schema query successful');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
})();
