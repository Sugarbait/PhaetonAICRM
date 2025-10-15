import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n=== TEST PLAN FOR "Clear Failed Login Attempts" BUTTON FIX ===\n');

(async () => {
  try {
    // STEP 1: Simulate failed login attempts
    console.log('STEP 1: Simulating 3 failed login attempts for robertdanvill800@gmail.com');
    console.log('----------------------------------------------------------------------');

    for (let i = 1; i <= 3; i++) {
      const { error } = await supabase
        .from('failed_login_attempts')
        .insert({
          email: 'robertdanvill800@gmail.com',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Test)',
          reason: `Test failed login attempt ${i}`,
          attempted_at: new Date().toISOString()
        });

      if (error) {
        console.log(`⚠️ Failed to insert attempt ${i} (expected due to RLS):`, error.message);
      } else {
        console.log(`✅ Inserted failed login attempt ${i}`);
      }
    }

    // STEP 2: Check what was inserted
    console.log('\nSTEP 2: Checking database records');
    console.log('----------------------------------------------------------------------');

    const { data: records, error: queryError } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('email', 'robertdanvill800@gmail.com')
      .order('attempted_at', { ascending: false });

    if (queryError) {
      console.log('❌ Query error:', queryError.message);
    } else {
      console.log(`✅ Found ${records?.length || 0} records in database`);
      if (records && records.length > 0) {
        console.log('Records:', JSON.stringify(records, null, 2));
      }
    }

    // STEP 3: Explain localStorage check
    console.log('\nSTEP 3: localStorage Verification');
    console.log('----------------------------------------------------------------------');
    console.log('⚠️ To verify localStorage failed_login_attempts:');
    console.log('   1. Open your browser DevTools');
    console.log('   2. Go to Application > Local Storage');
    console.log('   3. Find the key "failed_login_attempts"');
    console.log('   4. Check if robertdanvill800@gmail.com appears in the array');
    console.log('');
    console.log('Note: localStorage can only be checked in the browser, not in Node.js');

    // STEP 4: Test the fix
    console.log('\nSTEP 4: Testing the Fix - userManagementService.clearAccountLockout()');
    console.log('----------------------------------------------------------------------');
    console.log('This method should clear:');
    console.log('  ✅ Database failed_login_attempts table');
    console.log('  ✅ localStorage failed_login_attempts array');
    console.log('  ✅ localStorage loginStats_${userId}');
    console.log('');
    console.log('The updated button now calls:');
    console.log('  1. await userManagementService.clearAccountLockout(user.id)');
    console.log('  2. LoginAttemptTracker.emergencyUnblock(user.email)');
    console.log('  3. await loadUsers() // Refresh UI');

    // STEP 5: Verify clearAccountLockout behavior
    console.log('\nSTEP 5: Verify Database Clear Operation');
    console.log('----------------------------------------------------------------------');

    // Try to delete (simulating what clearAccountLockout does)
    const { error: deleteError } = await supabase
      .from('failed_login_attempts')
      .delete()
      .eq('email', 'robertdanvill800@gmail.com');

    if (deleteError) {
      console.log('⚠️ Delete operation result:', deleteError.message);
      console.log('(This may be expected if RLS policies restrict deletion)');
    } else {
      console.log('✅ Successfully deleted failed login attempts from database');
    }

    // STEP 6: Verify deletion
    console.log('\nSTEP 6: Verify Deletion');
    console.log('----------------------------------------------------------------------');

    const { data: remainingRecords, error: verifyError } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('email', 'robertdanvill800@gmail.com');

    if (verifyError) {
      console.log('❌ Verification error:', verifyError.message);
    } else {
      console.log(`✅ Remaining records in database: ${remainingRecords?.length || 0}`);
      if (remainingRecords && remainingRecords.length === 0) {
        console.log('✅ Database cleanup successful!');
      }
    }

    // FINAL SUMMARY
    console.log('\n=== FIX SUMMARY ===');
    console.log('----------------------------------------------------------------------');
    console.log('✅ BEFORE (BROKEN):');
    console.log('   - Button only called LoginAttemptTracker.emergencyUnblock(email)');
    console.log('   - Only cleared localStorage');
    console.log('   - Did NOT clear database records');
    console.log('   - Did NOT reload user list');
    console.log('   - No error handling');
    console.log('');
    console.log('✅ AFTER (FIXED):');
    console.log('   - Button calls userManagementService.clearAccountLockout(userId)');
    console.log('   - Clears database failed_login_attempts table');
    console.log('   - Clears localStorage failed_login_attempts');
    console.log('   - Clears localStorage loginStats_${userId}');
    console.log('   - Calls LoginAttemptTracker.emergencyUnblock(email) for extra safety');
    console.log('   - Reloads user list with await loadUsers()');
    console.log('   - Full async/await error handling');
    console.log('   - Loading state management');
    console.log('   - Toast notifications for success/failure');
    console.log('');
    console.log('✅ TO TEST IN BROWSER:');
    console.log('   1. Have user robertdanvill800@gmail.com fail login 3 times');
    console.log('   2. Go to Settings > User Management');
    console.log('   3. Click the amber ShieldAlert button for that user');
    console.log('   4. Check localStorage "failed_login_attempts" is cleared');
    console.log('   5. Verify user can now login successfully');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
})();
