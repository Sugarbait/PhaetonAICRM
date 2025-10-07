/**
 * Fix Masika's last login to show "Never"
 * Set last_login to null for users who have never actually logged in
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function fixMasikaNeverLoggedIn() {
  console.log('🔄 Fixing Masika\'s last login to show "Never"...\n');

  try {
    // Check current Masika user data
    const { data: masikaUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, last_login')
      .eq('name', 'Masika')
      .single();

    if (fetchError) {
      console.error('❌ Failed to fetch Masika user:', fetchError);
      return false;
    }

    console.log('📊 Current Masika user data:');
    console.log(`  Name: ${masikaUser.name}`);
    console.log(`  Email: ${masikaUser.email}`);
    console.log(`  Current last_login: ${masikaUser.last_login}`);
    console.log(`  Displays as: ${masikaUser.last_login ? new Date(masikaUser.last_login).toLocaleString() : 'NULL'}`);

    console.log('\n🔧 Setting last_login to NULL for Masika (never logged in):');

    // Set last_login to null since Masika has never actually logged in
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: null })
      .eq('name', 'Masika');

    if (updateError) {
      console.error('❌ Failed to update Masika\'s last_login:', updateError);
      return false;
    }

    console.log('✅ Set Masika\'s last_login to NULL');

    // Verify the update
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('name, email, last_login')
      .eq('name', 'Masika')
      .single();

    if (!verifyError && verifyUser) {
      console.log('\n🔍 Verification:');
      console.log(`  Name: ${verifyUser.name}`);
      console.log(`  Email: ${verifyUser.email}`);
      console.log(`  Updated last_login: ${verifyUser.last_login}`);
      console.log(`  Will display as: ${verifyUser.last_login ? new Date(verifyUser.last_login).toLocaleString() : '"Never"'}`);
    }

    console.log('\n🎉 Masika\'s last login fixed!');
    console.log('📝 Expected result:');
    console.log('  User Management page should now show:');
    console.log('  "Masika - Last login: Never"');
    console.log('\n📝 Next steps:');
    console.log('1. Clear browser cache/localStorage');
    console.log('2. Navigate to User Management page');
    console.log('3. Masika should now show "Never" for last login');

    return true;

  } catch (error) {
    console.error('❌ Script error:', error);
    return false;
  }
}

// Run the fix
fixMasikaNeverLoggedIn().then(success => {
  console.log(success ? '\n✅ Fix completed successfully' : '\n❌ Fix completed with errors');
  process.exit(success ? 0 : 1);
});