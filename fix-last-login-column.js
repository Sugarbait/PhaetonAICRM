/**
 * Fix script to add last_login tracking to user profiles
 * This will ensure all users show their last login time properly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function fixLastLoginColumn() {
  console.log('🚀 Fixing Last Login tracking for all users...\n');

  try {
    // Step 1: Check current database structure
    console.log('📊 Checking database structure...');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (fetchError) {
      if (fetchError.message.includes('last_login')) {
        console.log('⚠️ Database is missing last_login column.');
        console.log('\n❗ MANUAL ACTION REQUIRED:\n');
        console.log('Please add the last_login column to your Supabase database:');
        console.log('1. Go to your Supabase Dashboard (https://app.supabase.com)');
        console.log('2. Navigate to Table Editor > users table');
        console.log('3. Click "Add Column" with these settings:');
        console.log('   - Name: last_login');
        console.log('   - Type: timestamptz');
        console.log('   - Default: (leave empty)');
        console.log('   - Nullable: Yes (checked)');
        console.log('4. Click Save');
        console.log('\nAfter adding the column, run this script again.\n');
        return;
      }
      throw fetchError;
    }

    // Step 2: Get all users
    console.log('✅ Database structure looks good!');
    console.log('📥 Loading all users...');

    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, name, created_at, last_login');

    if (allUsersError) throw allUsersError;

    console.log(`Found ${allUsers.length} users in database\n`);

    // Step 3: Update users with missing last_login
    let updated = 0;
    for (const user of allUsers) {
      if (!user.last_login) {
        console.log(`🔧 Setting initial last_login for ${user.email}...`);

        // Set last_login to created_at for users who haven't logged in yet
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_login: user.created_at })
          .eq('id', user.id);

        if (!updateError) {
          updated++;
          console.log(`   ✅ Updated ${user.email}`);
        } else {
          console.log(`   ❌ Failed to update ${user.email}:`, updateError.message);
        }
      } else {
        console.log(`✅ ${user.email} already has last_login: ${new Date(user.last_login).toLocaleString()}`);
      }
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Last Login Fix Complete!');
    console.log('='.repeat(60));
    console.log(`✅ ${updated} users updated with initial last_login values`);
    console.log(`✅ ${allUsers.length - updated} users already had last_login set`);
    console.log('\n📝 Next Steps:');
    console.log('1. Refresh the User Management page');
    console.log('2. All users should now show their last login time');
    console.log('3. Future logins will automatically update the last_login field');
    console.log('\n✨ The system will now track last login for all new users automatically');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('1. Check your Supabase credentials in .env.local');
    console.error('2. Ensure your Supabase project is running');
    console.error('3. Verify you have the correct permissions');
    process.exit(1);
  }
}

// Run the fix
fixLastLoginColumn().catch(console.error);