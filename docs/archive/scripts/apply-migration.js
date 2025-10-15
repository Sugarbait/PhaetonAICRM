/**
 * Automated Migration Script
 *
 * This script attempts to apply the migration using the Supabase REST API.
 * If automatic execution fails, it provides manual instructions.
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const migrationSQL = `
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS retell_api_key TEXT,
ADD COLUMN IF NOT EXISTS call_agent_id TEXT,
ADD COLUMN IF NOT EXISTS sms_agent_id TEXT;
`.trim();

async function applyMigration() {
  console.log('🚀 Attempting automated migration...');
  console.log('');

  try {
    // Attempt to execute via Supabase REST API using a raw query approach
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (response.ok) {
      console.log('✅ Migration executed successfully!');
      console.log('');
      console.log('Run this to verify:');
      console.log('  node run-migration.js');
      return;
    }

    // If that didn't work, show manual instructions
    throw new Error('Automated execution not supported');

  } catch (err) {
    console.log('⚠️  Automated migration not available via REST API');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 PLEASE RUN MIGRATION MANUALLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Follow these steps:');
    console.log('');
    console.log('1. Open Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/sql/new');
    console.log('');
    console.log('2. Copy and paste this exact SQL:');
    console.log('');
    console.log('   ┌─────────────────────────────────────────────────────┐');
    console.log('   │ ALTER TABLE user_settings                           │');
    console.log('   │ ADD COLUMN IF NOT EXISTS retell_api_key TEXT,       │');
    console.log('   │ ADD COLUMN IF NOT EXISTS call_agent_id TEXT,        │');
    console.log('   │ ADD COLUMN IF NOT EXISTS sms_agent_id TEXT;         │');
    console.log('   └─────────────────────────────────────────────────────┘');
    console.log('');
    console.log('3. Click the "RUN" button (or press Ctrl+Enter)');
    console.log('');
    console.log('4. You should see: "Success. No rows returned"');
    console.log('');
    console.log('5. Verify the migration worked:');
    console.log('   node run-migration.js');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('💡 TIP: The SQL is also in:');
    console.log('   supabase/migrations/20251006000001_add_api_credentials_to_user_settings.sql');
    console.log('');
  }
}

applyMigration();
