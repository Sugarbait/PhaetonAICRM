import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 ===== DIAGNOSING GUEST USER LOGIN =====\n');

const guestEmail = 'guest@guest.com';
const newPassword = 'Guest123';

// Step 1: Check if user exists in users table
console.log('Step 1: Checking users table...');
const { data: user, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('email', guestEmail)
  .eq('tenant_id', 'artlee')
  .single();

if (userError) {
  console.error('❌ Error fetching user:', userError.message);
  process.exit(1);
}

console.log(`✅ User found in users table:`);
console.log(`   ID: ${user.id}`);
console.log(`   Email: ${user.email}`);
console.log(`   Role: ${user.role}`);
console.log(`   Active: ${user.is_active}`);
console.log('');

// Step 2: Check Supabase Auth
console.log('Step 2: Checking Supabase Auth...');
const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

if (authError) {
  console.error('❌ Error listing auth users:', authError.message);
} else {
  const authUser = authUsers.users.find(u => u.email === guestEmail);
  if (authUser) {
    console.log(`✅ User exists in Supabase Auth`);
    console.log(`   Auth ID: ${authUser.id}`);
    console.log(`   Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
  } else {
    console.log(`⚠️ User NOT found in Supabase Auth - will need to create auth user`);
  }
}
console.log('');

// Step 3: Check user_credentials table
console.log('Step 3: Checking user_credentials table...');
const { data: credentials, error: credError } = await supabase
  .from('user_credentials')
  .select('*')
  .eq('user_id', user.id)
  .single();

if (credError) {
  if (credError.code === 'PGRST116') {
    console.log('⚠️ No credentials found in user_credentials table');
  } else {
    console.error('❌ Error fetching credentials:', credError.message);
  }
} else {
  console.log(`✅ Credentials found in user_credentials table`);
  console.log(`   Has password hash: ${credentials.password ? 'Yes' : 'No'}`);
}
console.log('');

// Step 4: Fix the login by setting up both auth methods
console.log('Step 4: Setting up authentication...\n');

// Create/update Supabase Auth user
console.log('Creating Supabase Auth user...');
try {
  const { data: authUser, error: createAuthError } = await supabase.auth.admin.createUser({
    email: guestEmail,
    password: newPassword,
    email_confirm: true,
    user_metadata: {
      name: 'Guest',
      tenant_id: 'artlee'
    }
  });

  if (createAuthError) {
    if (createAuthError.message.includes('already registered')) {
      console.log('⚠️ User already exists in Supabase Auth, updating password...');

      // Get auth user ID
      const authUsersList = await supabase.auth.admin.listUsers();
      const existingAuthUser = authUsersList.data.users.find(u => u.email === guestEmail);

      if (existingAuthUser) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingAuthUser.id,
          { password: newPassword }
        );

        if (updateError) {
          console.error('❌ Error updating password:', updateError.message);
        } else {
          console.log('✅ Password updated in Supabase Auth');
        }
      }
    } else {
      console.error('❌ Error creating auth user:', createAuthError.message);
    }
  } else {
    console.log('✅ Supabase Auth user created successfully');
  }
} catch (err) {
  console.error('❌ Exception:', err.message);
}

// Create/update local credentials as fallback
console.log('\nCreating local credentials fallback...');
const passwordHash = await bcrypt.hash(newPassword, 10);

const { error: upsertError } = await supabase
  .from('user_credentials')
  .upsert({
    user_id: user.id,
    password: passwordHash,
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'user_id'
  });

if (upsertError) {
  console.error('❌ Error upserting credentials:', upsertError.message);
} else {
  console.log('✅ Local credentials created/updated successfully');
}

console.log('\n🎉 ===== LOGIN FIX COMPLETE =====\n');
console.log('You can now log in with:');
console.log(`   Email: ${guestEmail}`);
console.log(`   Password: ${newPassword}`);
console.log('\n=====================================\n');
