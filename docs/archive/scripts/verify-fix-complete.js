import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n✅ ===== VERIFYING FIX IS COMPLETE =====\n');

const tenantId = 'artlee';
let allChecksPassed = true;

// Check 1: Verify database columns exist
console.log('Check 1: Verifying database schema...');

// Try to select the columns directly (simplest check)
const { error: selectError } = await supabase
  .from('user_settings')
  .select('retell_api_key, call_agent_id, sms_agent_id')
  .limit(1);

if (selectError) {
  console.error('❌ FAIL: Database columns missing!');
  console.error('   Error:', selectError.message);
  console.log('   👉 You MUST apply the migration first!');
  console.log('   👉 See COMPLETE-FIX-GUIDE.md Step 1');
  console.log('   👉 URL: https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/sql/new');
  allChecksPassed = false;
} else {
  console.log('✅ PASS: Database columns exist (retell_api_key, call_agent_id, sms_agent_id)');
}

// Check 2: Verify user credentials are saved
console.log('\nCheck 2: Checking for saved credentials...');
const { data: settings, error: settingsError } = await supabase
  .from('user_settings')
  .select('*')
  .eq('tenant_id', tenantId);

if (settingsError) {
  console.error('❌ FAIL: Could not query user_settings table');
  console.error('   Error:', settingsError.message);
  allChecksPassed = false;
} else if (!settings || settings.length === 0) {
  console.log('⚠️ WARNING: No user settings found for ARTLEE tenant');
  console.log('   This is normal if you haven\'t entered credentials yet');
  console.log('   👉 After clearing cache, go to Settings → API Configuration and enter credentials');
} else {
  console.log(`✅ Found ${settings.length} user settings record(s)`);

  let hasRealCredentials = false;
  for (const setting of settings) {
    console.log(`\n   User ID: ${setting.user_id}`);

    if (setting.retell_api_key) {
      const keyPreview = setting.retell_api_key.substring(0, 8) + '...';
      const isTestKey = setting.retell_api_key.startsWith('test_key_');

      if (isTestKey) {
        console.log(`   ❌ API Key: ${keyPreview} (TEST CREDENTIAL - NOT REAL)`);
        console.log('      👉 Clear browser cache and enter REAL credentials');
      } else {
        console.log(`   ✅ API Key: ${keyPreview} (looks real, length: ${setting.retell_api_key.length})`);
        hasRealCredentials = true;
      }
    } else {
      console.log('   ⚠️ API Key: NOT SET');
    }

    if (setting.call_agent_id) {
      const isTestAgent = setting.call_agent_id.includes('test_') || /\d{13}/.test(setting.call_agent_id);
      if (isTestAgent) {
        console.log(`   ❌ Call Agent ID: ${setting.call_agent_id} (TEST CREDENTIAL)`);
      } else {
        console.log(`   ✅ Call Agent ID: ${setting.call_agent_id}`);
        hasRealCredentials = true;
      }
    } else {
      console.log('   ⚠️ Call Agent ID: NOT SET');
    }

    if (setting.sms_agent_id) {
      const isTestAgent = setting.sms_agent_id.includes('test_') || /\d{13}/.test(setting.sms_agent_id);
      if (isTestAgent) {
        console.log(`   ❌ SMS Agent ID: ${setting.sms_agent_id} (TEST CREDENTIAL)`);
      } else {
        console.log(`   ✅ SMS Agent ID: ${setting.sms_agent_id}`);
        hasRealCredentials = true;
      }
    } else {
      console.log('   ⚠️ SMS Agent ID: NOT SET');
    }
  }

  if (!hasRealCredentials) {
    console.log('\n⚠️ WARNING: No REAL credentials found (only test credentials or empty)');
    console.log('   👉 Clear browser cache using COMPLETE-FIX-GUIDE.md Step 2');
    console.log('   👉 Then enter REAL credentials in Settings → API Configuration');
  }
}

// Final summary
console.log('\n' + '='.repeat(80));
console.log('\n📊 VERIFICATION SUMMARY:\n');

if (allChecksPassed) {
  console.log('✅ Database schema is correct');
  console.log('✅ Migration has been applied successfully');
  console.log('\n🎯 NEXT STEPS:');
  console.log('   1. Clear browser cache (see COMPLETE-FIX-GUIDE.md Step 2)');
  console.log('   2. Login to http://localhost:9020');
  console.log('   3. Go to Settings → API Configuration');
  console.log('   4. Enter your REAL Retell AI credentials (key_xxx, agent_xxx)');
  console.log('   5. Click Save');
  console.log('   6. Logout and login again to verify credentials persist');
} else {
  console.log('❌ MIGRATION NOT APPLIED');
  console.log('\n🚨 YOU MUST APPLY THE DATABASE MIGRATION FIRST!');
  console.log('   See COMPLETE-FIX-GUIDE.md Step 1');
  console.log('   URL: https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/sql/new');
}

console.log('\n' + '='.repeat(80) + '\n');
