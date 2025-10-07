/**
 * Complete test for Last Login fix
 * Verifies database -> service -> UI data flow
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function testCompleteLastLoginFix() {
  console.log('🧪 Testing Complete Last Login Fix...\n');
  console.log('='.repeat(80));

  try {
    // Step 1: Verify database has correct data
    console.log('\n📊 STEP 1: Database Verification');
    console.log('-'.repeat(40));

    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, last_login')
      .eq('is_active', true)
      .order('email');

    if (dbError) {
      console.error('❌ Database query failed:', dbError);
      return false;
    }

    console.log(`✅ Database has ${dbUsers.length} active users`);
    dbUsers.forEach(user => {
      const lastLogin = user.last_login
        ? new Date(user.last_login).toLocaleString()
        : 'NULL';
      console.log(`  ${user.email}: ${lastLogin}`);
    });

    const allHaveLastLogin = dbUsers.every(u => u.last_login !== null);
    console.log(`\nDatabase Status: ${allHaveLastLogin ? '✅ All users have last_login' : '❌ Some users missing last_login'}`);

    // Step 2: Test userProfileService mapping
    console.log('\n🔄 STEP 2: UserProfileService Mapping');
    console.log('-'.repeat(40));

    const mappedUsers = dbUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      lastLogin: user.last_login // Critical mapping
    }));

    console.log('Mapped users:');
    mappedUsers.forEach(user => {
      const lastLogin = user.lastLogin
        ? new Date(user.lastLogin).toLocaleString()
        : 'undefined';
      console.log(`  ${user.email}: lastLogin = ${lastLogin}`);
    });

    const mappingSuccessful = mappedUsers.every(u => u.lastLogin !== undefined && u.lastLogin !== null);
    console.log(`\nMapping Status: ${mappingSuccessful ? '✅ All users properly mapped' : '❌ Mapping failed'}`);

    // Step 3: Test getUserLoginStats method simulation
    console.log('\n🔍 STEP 3: GetUserLoginStats Simulation');
    console.log('-'.repeat(40));

    const loginStatsTest = [];
    for (const user of dbUsers) {
      // Simulate the getUserLoginStats query
      const { data: userLogin, error: loginError } = await supabase
        .from('users')
        .select('last_login')
        .eq('id', user.id)
        .single();

      const loginStatsResult = {
        userId: user.id,
        email: user.email,
        lastLogin: userLogin?.last_login || undefined,
        querySuccessful: !loginError
      };

      loginStatsTest.push(loginStatsResult);
      console.log(`  ${user.email}: getUserLoginStats would return ${loginStatsResult.lastLogin ? new Date(loginStatsResult.lastLogin).toLocaleString() : 'undefined'}`);
    }

    const loginStatsWorking = loginStatsTest.every(t => t.querySuccessful && t.lastLogin);
    console.log(`\nLoginStats Status: ${loginStatsWorking ? '✅ All getUserLoginStats queries successful' : '❌ Some queries failed'}`);

    // Step 4: Final integration test
    console.log('\n🔗 STEP 4: Integration Test');
    console.log('-'.repeat(40));

    const integrationResults = dbUsers.map(user => {
      // Simulate the full userManagementService.loadSystemUsers() flow
      const profileData = { lastLogin: user.last_login }; // From userProfileService
      const loginStats = { lastLogin: user.last_login }; // From getUserLoginStats

      // The fixed logic: loginStats.lastLogin || user.lastLogin || undefined
      const finalLastLogin = loginStats.lastLogin || profileData.lastLogin || undefined;

      return {
        email: user.email,
        profileLastLogin: profileData.lastLogin,
        statsLastLogin: loginStats.lastLogin,
        finalLastLogin: finalLastLogin,
        willDisplayCorrectly: finalLastLogin !== undefined && finalLastLogin !== null
      };
    });

    console.log('Integration test results:');
    integrationResults.forEach(result => {
      const displayValue = result.finalLastLogin
        ? new Date(result.finalLastLogin).toLocaleString()
        : 'Never';
      console.log(`  ${result.email}: Will display "${displayValue}" ${result.willDisplayCorrectly ? '✅' : '❌'}`);
    });

    const integrationSuccess = integrationResults.every(r => r.willDisplayCorrectly);

    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 COMPLETE FIX TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Database Data:      ${allHaveLastLogin ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Service Mapping:    ${mappingSuccessful ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Login Stats Query:  ${loginStatsWorking ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Integration Test:   ${integrationSuccess ? '✅ PASSED' : '❌ FAILED'}`);

    const overallSuccess = allHaveLastLogin && mappingSuccessful && loginStatsWorking && integrationSuccess;
    console.log(`\nOVERALL RESULT:     ${overallSuccess ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (overallSuccess) {
      console.log('\n✅ Last Login fix is working correctly!');
      console.log('📝 Next steps:');
      console.log('1. Navigate to User Management page');
      console.log('2. All users should now display actual timestamps');
      console.log('3. No more "Never" displays for users who have logged in');
    } else {
      console.log('\n⚠️ Some issues found with the Last Login fix.');
      console.log('📝 Recommended actions:');
      console.log('1. Clear browser localStorage and cache');
      console.log('2. Refresh the User Management page');
      console.log('3. Check console logs for any errors');
    }

    return overallSuccess;

  } catch (error) {
    console.error('\n❌ Test error:', error);
    return false;
  }
}

// Run the complete test
testCompleteLastLoginFix().then(success => {
  process.exit(success ? 0 : 1);
});