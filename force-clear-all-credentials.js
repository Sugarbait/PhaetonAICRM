import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🗑️ ===== FORCE CLEARING ALL ARTLEE CREDENTIALS =====\n');

const tenantId = 'artlee';

// Step 1: Clear from Supabase user_settings
console.log('Step 1: Clearing credentials from Supabase user_settings table...');
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
      const { error: deleteError } = await supabase
        .from('user_settings')
        .delete()
        .eq('id', setting.id)
        .eq('tenant_id', tenantId);

      if (deleteError) {
        console.error(`❌ Error deleting setting ${setting.id}:`, deleteError.message);
      } else {
        console.log(`✅ Deleted setting record for user: ${setting.user_id}`);
      }
    }
  } else {
    console.log('ℹ️ No settings records to delete from Supabase');
  }
}

console.log('\n✅ Database cleared!');
console.log('\n📋 NEXT STEPS:\n');
console.log('1. Open ARTLEE CRM in your browser (http://localhost:9020)');
console.log('2. Open browser console (F12)');
console.log('3. Run these commands to clear browser cache:\n');
console.log('   // Clear localStorage credentials');
console.log('   Object.keys(localStorage).forEach(key => {');
console.log('     if (key.includes("retell") || key.includes("settings_") || key.includes("credentials")) {');
console.log('       localStorage.removeItem(key);');
console.log('       console.log("Cleared:", key);');
console.log('     }');
console.log('   });\n');
console.log('   // Clear sessionStorage credentials');
console.log('   Object.keys(sessionStorage).forEach(key => {');
console.log('     if (key.includes("retell") || key.includes("credentials")) {');
console.log('       sessionStorage.removeItem(key);');
console.log('       console.log("Cleared:", key);');
console.log('     }');
console.log('   });\n');
console.log('   // Hard refresh');
console.log('   location.reload(true);\n');
console.log('4. After refresh, go to Settings → API Configuration');
console.log('5. Enter your REAL Retell AI credentials');
console.log('6. Click Save');
console.log('7. Check browser console for save confirmation\n');
console.log('=====================================\n');
