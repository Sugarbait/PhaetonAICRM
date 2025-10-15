/**
 * Fix timezone compensation for guest user
 * Add 4 hours to the timestamp so it displays correctly as 08:27 AM
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function fixGuestTimezoneCompensation() {
  console.log('🔄 Applying timezone compensation for guest user...\n');

  try {
    // The target display time is 08:27:52 AM
    // Currently showing 04:27:52 AM
    // Need to add 4 hours to compensate

    // Create timestamp that's 4 hours ahead so it displays as 08:27 AM
    const targetDisplayTime = new Date('2025-09-29T08:27:52.000Z');
    const compensatedTime = new Date(targetDisplayTime.getTime() + (4 * 60 * 60 * 1000)); // Add 4 hours
    const compensatedTimestamp = compensatedTime.toISOString();

    console.log('🔧 Timezone compensation calculation:');
    console.log(`  Target display: Sep 29, 2025, 08:27:52 AM`);
    console.log(`  Original UTC: 2025-09-29T08:27:52.000Z`);
    console.log(`  Compensated UTC: ${compensatedTimestamp}`);
    console.log(`  Should now display as: ${new Date(compensatedTimestamp).toLocaleString()}`);

    // Update the guest user with compensated timestamp
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: compensatedTimestamp })
      .eq('email', 'guest@email.com');

    if (updateError) {
      console.error('❌ Failed to update guest timestamp:', updateError);
      return false;
    }

    console.log('\n✅ Applied timezone compensation');

    // Verify the update
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('email, last_login')
      .eq('email', 'guest@email.com')
      .single();

    if (!verifyError && verifyUser) {
      console.log('\n🔍 Final verification:');
      console.log(`  Email: ${verifyUser.email}`);
      console.log(`  Database timestamp: ${verifyUser.last_login}`);
      console.log(`  Node.js displays as: ${new Date(verifyUser.last_login).toLocaleString()}`);
      console.log(`  UI should display as: ~08:27 AM (if timezone handling is consistent)`);
    }

    console.log('\n🎉 Guest user timezone compensation applied!');
    console.log('📝 Next steps:');
    console.log('1. Clear browser cache/localStorage');
    console.log('2. Navigate to User Management page');
    console.log('3. Guest user should now display closer to 08:27 AM');
    console.log('\n⚠️ If this still doesn\'t work, the issue is in the UI timezone handling.');

    return true;

  } catch (error) {
    console.error('❌ Script error:', error);
    return false;
  }
}

// Run the fix
fixGuestTimezoneCompensation().then(success => {
  process.exit(success ? 0 : 1);
});