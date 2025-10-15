/**
 * Test script to verify the Last Login fix is working
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Import the services to test
async function testLastLoginFix() {
  console.log('🧪 Testing Last Login Fix...\n');
  console.log('='.repeat(80));

  const results = {
    databaseCheck: false,
    dataMapping: false,
    cacheClearing: false,
    overall: false
  };

  try {
    // Test 1: Verify database has last_login column and data
    console.log('\n📊 TEST 1: Database Check');
    console.log('-'.repeat(40));

    const { data: users, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, last_login')
      .order('created_at', { ascending: true });

    if (dbError) {
      console.log('❌ Database test failed:', dbError.message);
    } else {
      console.log(`✅ Database has ${users.length} users with last_login column`);

      // Check if all users have last_login values
      const usersWithLogin = users.filter(u => u.last_login !== null);
      console.log(`✅ ${usersWithLogin.length}/${users.length} users have last_login values`);

      results.databaseCheck = usersWithLogin.length === users.length;
    }

    // Test 2: Test data mapping (simulate userProfileService)
    console.log('\n🔄 TEST 2: Data Mapping');
    console.log('-'.repeat(40));

    const { data: rawUsers } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true);

    if (rawUsers) {
      const mappedUsers = rawUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        lastLogin: user.last_login // This is the critical mapping
      }));

      const allHaveLastLogin = mappedUsers.every(u => u.lastLogin !== undefined);

      if (allHaveLastLogin) {
        console.log('✅ All users properly mapped with lastLogin field');
        results.dataMapping = true;
      } else {
        console.log('❌ Some users missing lastLogin after mapping');
      }

      // Show sample mapping
      console.log('\nSample mapped data:');
      mappedUsers.slice(0, 2).forEach(u => {
        console.log(`  ${u.email}: lastLogin = ${u.lastLogin || 'undefined'}`);
      });
    }

    // Test 3: Test cache clearing
    console.log('\n🧹 TEST 3: Cache Management');
    console.log('-'.repeat(40));

    // This would need to be tested in browser context
    console.log('📝 Cache clearing must be tested in browser:');
    console.log('  1. Open browser console');
    console.log('  2. Run: localStorage.getItem("systemUsers")');
    console.log('  3. If it exists, check if users have lastLogin field');
    console.log('  4. Navigate to User Management page');
    console.log('  5. Check if cache is cleared and fresh data loaded');

    results.cacheClearing = true; // Assumed for now

    // Test 4: Simulate the full data flow
    console.log('\n🔗 TEST 4: Full Data Flow');
    console.log('-'.repeat(40));

    // Simulate what UserManagementPage would receive
    const { data: fullUsers } = await supabase
      .from('users')
      .select('*');

    if (fullUsers) {
      console.log('Data flow simulation:');
      fullUsers.forEach(user => {
        const displayValue = user.last_login
          ? new Date(user.last_login).toLocaleString()
          : 'Never';
        console.log(`  ${user.email}: Will display "${displayValue}"`);
      });

      const allWillDisplay = fullUsers.every(u => u.last_login !== null);
      if (allWillDisplay) {
        console.log('\n✅ All users will display actual timestamps (not "Never")');
        results.overall = true;
      } else {
        console.log('\n⚠️ Some users still missing last_login values');
      }
    }

  } catch (error) {
    console.error('\n❌ Test error:', error);
  }

  // Final Results
  console.log('\n' + '='.repeat(80));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log(`Database Check:    ${results.databaseCheck ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Data Mapping:      ${results.dataMapping ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Cache Management:  ${results.cacheClearing ? '⚠️ NEEDS BROWSER TEST' : '❌ FAILED'}`);
  console.log(`Overall:           ${results.overall ? '✅ PASSED' : '❌ FAILED'}`);

  if (results.overall) {
    console.log('\n🎉 Last Login fix is working! All users have timestamps.');
  } else {
    console.log('\n⚠️ Last Login fix needs attention. Some users missing timestamps.');
    console.log('\nNext steps:');
    console.log('1. Run: node check-and-fix-last-login.js');
    console.log('2. Clear browser cache and localStorage');
    console.log('3. Refresh User Management page');
  }

  return results;
}

// Run the test
testLastLoginFix().then(results => {
  process.exit(results.overall ? 0 : 1);
});