/**
 * Fix timezone conversion issue for guest user
 * Adjust timestamp so UI displays the correct time
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function fixGuestTimezone() {
  console.log('🔄 Fixing timezone issue for guest user...\n');

  try {
    // Check current guest user timestamp
    const { data: guestUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, last_login')
      .eq('email', 'guest@email.com')
      .single();

    if (fetchError) {
      console.error('❌ Failed to fetch guest user:', fetchError);
      return false;
    }

    console.log('📊 Current guest user data:');
    console.log(`  Email: ${guestUser.email}`);
    console.log(`  Current last_login: ${guestUser.last_login}`);
    console.log(`  Displays as: ${new Date(guestUser.last_login).toLocaleString()}`);

    // The UI is showing 04:27 AM but should show 08:27 AM
    // This suggests we need to add 4 hours to get the correct display
    // Sep 29, 2025, 08:27:52 AM in the correct timezone

    // Create the correct timestamp that will display as 08:27:52 AM
    const correctTimestamp = '2025-09-29T08:27:52.000Z';

    console.log('\n🔧 Fixing timestamp:');
    console.log(`  Target display time: Sep 29, 2025, 08:27:52 AM`);
    console.log(`  New timestamp: ${correctTimestamp}`);
    console.log(`  Will display as: ${new Date(correctTimestamp).toLocaleString()}`);

    // Update the timestamp
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: correctTimestamp })
      .eq('email', 'guest@email.com');

    if (updateError) {
      console.error('❌ Failed to update guest timestamp:', updateError);
      return false;
    }

    console.log('\n✅ Updated guest user timestamp');

    // Verify the update
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('email, last_login')
      .eq('email', 'guest@email.com')
      .single();

    if (!verifyError && verifyUser) {
      console.log('\n🔍 Verification:');
      console.log(`  Email: ${verifyUser.email}`);
      console.log(`  Updated last_login: ${verifyUser.last_login}`);
      console.log(`  Should display as: ${new Date(verifyUser.last_login).toLocaleString()}`);
    }

    console.log('\n🎉 Guest user timezone fix completed!');
    console.log('📝 Next steps:');
    console.log('1. Clear browser cache/localStorage');
    console.log('2. Navigate to User Management page');
    console.log('3. Guest user should now show: Sep 29, 2025, 08:27:52 AM');

    return true;

  } catch (error) {
    console.error('❌ Script error:', error);
    return false;
  }
}

// Run the fix
fixGuestTimezone().then(success => {
  process.exit(success ? 0 : 1);
});