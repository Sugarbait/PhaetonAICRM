/**
 * Fix last_login timestamps based on the actual login history screenshots
 * Updates users table with the exact times shown in login history
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function fixLastLoginFromScreenshots() {
  console.log('🔄 Fixing last_login timestamps based on actual login history...\n');
  console.log('='.repeat(80));

  // Based on your screenshots, here are the ACTUAL most recent login times:
  const actualLoginTimes = {
    'pierre@phaetonai.com': {
      // From screenshot: Sep 29, 2025, 09:49:43 AM
      timestamp: '2025-09-29T09:49:43.000Z',
      display: 'Sep 29, 2025, 09:49:43 AM'
    },
    'elmfarrell@yahoo.com': {
      // From screenshot: Sep 27, 2025, 06:17:06 PM
      timestamp: '2025-09-27T18:17:06.000Z',
      display: 'Sep 27, 2025, 06:17:06 PM'
    },
    'guest@email.com': {
      // From screenshot: Sep 29, 2025, 08:27:52 AM
      timestamp: '2025-09-29T08:27:52.000Z',
      display: 'Sep 29, 2025, 08:27:52 AM'
    }
  };

  try {
    // Get current users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, last_login')
      .eq('is_active', true)
      .order('email');

    if (usersError) {
      console.error('❌ Failed to fetch users:', usersError);
      return false;
    }

    console.log(`📊 Found ${users.length} active users\n`);

    // Show current vs correct times
    console.log('📋 CURRENT vs CORRECT LOGIN TIMES');
    console.log('-'.repeat(80));

    users.forEach(user => {
      const current = user.last_login
        ? new Date(user.last_login).toLocaleString()
        : 'NULL';

      if (actualLoginTimes[user.email]) {
        const correct = actualLoginTimes[user.email].display;
        console.log(`${user.email}:`);
        console.log(`  Current:  ${current}`);
        console.log(`  Correct:  ${correct}`);
        console.log(`  Status:   ${current === correct ? '✅ Already correct' : '⚠️ Needs update'}`);
      } else {
        console.log(`${user.email}: No login history available`);
      }
      console.log('');
    });

    // Perform updates
    console.log('\n🔄 Updating timestamps...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      if (actualLoginTimes[user.email]) {
        try {
          const correctTimestamp = actualLoginTimes[user.email].timestamp;

          const { error: updateError } = await supabase
            .from('users')
            .update({ last_login: correctTimestamp })
            .eq('id', user.id);

          if (updateError) {
            console.error(`❌ Failed to update ${user.email}:`, updateError);
            errorCount++;
          } else {
            console.log(`✅ Updated ${user.email}: ${actualLoginTimes[user.email].display}`);
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Error updating ${user.email}:`, error);
          errorCount++;
        }
      } else {
        console.log(`⏭️ Skipped ${user.email}: No login history data`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📋 UPDATE SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Successful updates: ${successCount}`);
    console.log(`❌ Failed updates: ${errorCount}`);
    console.log(`⏭️ Skipped (no data): ${users.length - successCount - errorCount}`);

    if (successCount > 0) {
      console.log('\n🎉 Last login timestamps fixed!');
      console.log('📝 Now the User Management page should show:');
      Object.entries(actualLoginTimes).forEach(([email, data]) => {
        console.log(`  ${email}: ${data.display}`);
      });
      console.log('\n✅ These should now match the Login History exactly!');
    }

    // Verify the final state
    console.log('\n🔍 Verifying updates...');
    const { data: verifyUsers, error: verifyError } = await supabase
      .from('users')
      .select('id, email, last_login')
      .eq('is_active', true)
      .order('email');

    if (!verifyError && verifyUsers) {
      console.log('\nFinal verification:');
      verifyUsers.forEach(user => {
        const lastLogin = user.last_login
          ? new Date(user.last_login).toLocaleString()
          : 'NULL';
        const matches = actualLoginTimes[user.email] &&
                       lastLogin === actualLoginTimes[user.email].display;
        console.log(`  ${user.email}: ${lastLogin} ${matches ? '✅' : ''}`);
      });
    }

    return errorCount === 0;

  } catch (error) {
    console.error('❌ Script error:', error);
    return false;
  }
}

// Run the fix
fixLastLoginFromScreenshots().then(success => {
  console.log('\n' + (success ? '✅ Fix completed successfully' : '❌ Fix completed with errors'));
  console.log('📝 Next steps:');
  console.log('1. Clear browser localStorage cache');
  console.log('2. Navigate to User Management page');
  console.log('3. Last login should now match Login History exactly');
  process.exit(success ? 0 : 1);
});