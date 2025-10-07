import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🧹 ===== AGGRESSIVE TEST CREDENTIAL CLEARING =====\n');

const tenantId = 'artlee';

// Step 1: Clear ALL credentials from Supabase user_settings (even encrypted ones)
console.log('Step 1: Clearing ALL credentials from Supabase...');
const { data: settings, error: fetchError } = await supabase
  .from('user_settings')
  .select('*')
  .eq('tenant_id', tenantId);

if (fetchError) {
  console.error('❌ Error fetching settings:', fetchError.message);
} else {
  console.log(`Found ${settings?.length || 0} settings records for ARTLEE`);

  if (settings && settings.length > 0) {
    for (const setting of settings) {
      // Clear encrypted_api_keys JSONB field
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          encrypted_api_keys: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', setting.id)
        .eq('tenant_id', tenantId);

      if (updateError) {
        console.error(`❌ Error clearing setting ${setting.id}:`, updateError.message);
      } else {
        console.log(`✅ Cleared encrypted_api_keys for user: ${setting.user_id}`);
      }
    }
  } else {
    console.log('ℹ️ No settings records to clear from Supabase');
  }
}

console.log('\n✅ Database credentials cleared!');
console.log('\n📋 NEXT STEPS - COPY AND PASTE THESE INTO YOUR BROWSER CONSOLE:\n');
console.log('='.repeat(80));
console.log('\n// 1. AGGRESSIVE SESSIONSTORAGE CLEAR');
console.log('Object.keys(sessionStorage).forEach(key => {');
console.log('  sessionStorage.removeItem(key);');
console.log('  console.log("Cleared sessionStorage:", key);');
console.log('});');
console.log('console.log("✅ All sessionStorage cleared");');
console.log('');
console.log('// 2. AGGRESSIVE LOCALSTORAGE CLEAR (keeps auth only)');
console.log('const keysToKeep = ["supabase.auth.token"];');
console.log('Object.keys(localStorage).forEach(key => {');
console.log('  if (!keysToKeep.includes(key)) {');
console.log('    localStorage.removeItem(key);');
console.log('    console.log("Cleared localStorage:", key);');
console.log('  }');
console.log('});');
console.log('console.log("✅ All localStorage cleared (except auth)");');
console.log('');
console.log('// 3. HARD RELOAD');
console.log('setTimeout(() => {');
console.log('  window.location.href = window.location.origin;');
console.log('  window.location.reload(true);');
console.log('}, 1000);');
console.log('\n' + '='.repeat(80));
console.log('\n🔴 CRITICAL: After running the above commands, you MUST apply the database migration');
console.log('before entering real credentials, or they will not save!\n');
console.log('See MIGRATION_GUIDE.md for instructions.\n');
