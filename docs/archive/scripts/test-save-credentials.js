import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🧪 ===== TESTING CREDENTIAL SAVE TO SUPABASE =====\n');

const tenantId = 'artlee';

// Get ARTLEE users
console.log('Step 1: Finding ARTLEE users...');
const { data: users, error: usersError } = await supabase
  .from('users')
  .select('*')
  .eq('tenant_id', tenantId);

if (usersError) {
  console.error('❌ Error fetching users:', usersError.message);
  process.exit(1);
}

console.log(`✅ Found ${users.length} ARTLEE users:`);
users.forEach(u => console.log(`  - ${u.email} (ID: ${u.id})`));

// Test save credentials for first user
if (users.length === 0) {
  console.log('❌ No users found - cannot test save');
  process.exit(1);
}

const testUser = users[0];
console.log(`\nStep 2: Testing credential save for ${testUser.email}...`);

const testCredentials = {
  retell_api_key: 'key_test_save_verification',
  call_agent_id: 'agent_test_call_verification',
  sms_agent_id: 'agent_test_sms_verification'
};

// Try to save to user_settings
console.log('Attempting to save to user_settings table...');

const { data: existingSettings, error: checkError } = await supabase
  .from('user_settings')
  .select('*')
  .eq('user_id', testUser.id)
  .eq('tenant_id', tenantId)
  .maybeSingle();

if (checkError) {
  console.error('❌ Error checking existing settings:', checkError.message);
}

if (existingSettings) {
  console.log('Found existing settings, updating...');
  const { data: updateData, error: updateError } = await supabase
    .from('user_settings')
    .update({
      retell_api_key: testCredentials.retell_api_key,
      call_agent_id: testCredentials.call_agent_id,
      sms_agent_id: testCredentials.sms_agent_id,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', testUser.id)
    .eq('tenant_id', tenantId)
    .select();

  if (updateError) {
    console.error('❌ Update failed:', updateError.message);
    console.error('Error details:', JSON.stringify(updateError, null, 2));
  } else {
    console.log('✅ Update successful!');
    console.log('Updated record:', JSON.stringify(updateData, null, 2));
  }
} else {
  console.log('No existing settings, inserting new record...');
  const { data: insertData, error: insertError } = await supabase
    .from('user_settings')
    .insert({
      user_id: testUser.id,
      tenant_id: tenantId,
      retell_api_key: testCredentials.retell_api_key,
      call_agent_id: testCredentials.call_agent_id,
      sms_agent_id: testCredentials.sms_agent_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select();

  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    console.error('Error code:', insertError.code);
    console.error('Error details:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ Insert successful!');
    console.log('Inserted record:', JSON.stringify(insertData, null, 2));
  }
}

// Verify save
console.log('\nStep 3: Verifying saved credentials...');
const { data: verifyData, error: verifyError } = await supabase
  .from('user_settings')
  .select('*')
  .eq('user_id', testUser.id)
  .eq('tenant_id', tenantId)
  .maybeSingle();

if (verifyError) {
  console.error('❌ Verification failed:', verifyError.message);
} else if (!verifyData) {
  console.log('❌ No settings found after save attempt');
} else {
  console.log('✅ Credentials verified in database:');
  console.log('  API Key:', verifyData.retell_api_key);
  console.log('  Call Agent ID:', verifyData.call_agent_id);
  console.log('  SMS Agent ID:', verifyData.sms_agent_id);
}

console.log('\n=====================================\n');
