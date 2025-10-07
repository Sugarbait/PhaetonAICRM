import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 ===== CHECKING USER_SETTINGS TABLE SCHEMA =====\n');

// Try to query any record to see what columns exist
const { data, error } = await supabase
  .from('user_settings')
  .select('*')
  .limit(1);

if (error) {
  console.error('Error querying user_settings:', error.message);
} else {
  if (data && data.length > 0) {
    console.log('✅ user_settings table exists with columns:');
    console.log(Object.keys(data[0]));
    console.log('\nSample record:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('ℹ️ user_settings table exists but has no records');
    console.log('Attempting to get column info from empty table...');
  }
}

// Check if API credential columns exist
console.log('\n🔍 Checking for API credential columns...');

const requiredColumns = ['retell_api_key', 'call_agent_id', 'sms_agent_id'];

for (const col of requiredColumns) {
  const { data: testData, error: testError } = await supabase
    .from('user_settings')
    .select(col)
    .limit(1);

  if (testError) {
    console.log(`❌ Column "${col}" - NOT FOUND (${testError.message})`);
  } else {
    console.log(`✅ Column "${col}" - EXISTS`);
  }
}

console.log('\n=====================================\n');
