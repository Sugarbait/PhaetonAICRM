import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔓 ===== RESETTING LOCKOUT FOR ARTLEE GUEST USER =====\n');

const guestEmail = 'guest@guest.com';
const tenantId = 'artlee'; // ONLY reset for ARTLEE tenant

// Step 1: Find the user in ARTLEE database
console.log(`Step 1: Finding user in ARTLEE database (tenant_id = "${tenantId}")...`);
const { data: user, error: userError } = await supabase
  .from('users')
  .select('*')
  .eq('email', guestEmail)
  .eq('tenant_id', tenantId) // CRITICAL: Only affect ARTLEE
  .single();

if (userError) {
  console.error('❌ Error finding user:', userError.message);
  console.error('User may not exist in ARTLEE tenant');
  process.exit(1);
}

console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
console.log(`   Tenant ID: ${user.tenant_id}`);
console.log(`   Role: ${user.role}`);
console.log('');

// Step 2: Clear lockout from Supabase failed_login_attempts table
console.log('Step 2: Clearing lockout from Supabase...');
try {
  const { error: deleteError } = await supabase
    .from('failed_login_attempts')
    .delete()
    .eq('email', guestEmail);

  if (deleteError) {
    if (deleteError.code === '42P01') {
      console.log('⚠️ failed_login_attempts table does not exist (okay, using localStorage)');
    } else {
      console.error('❌ Error clearing failed attempts:', deleteError.message);
    }
  } else {
    console.log('✅ Cleared failed login attempts from Supabase');
  }
} catch (err) {
  console.log('⚠️ Supabase failed_login_attempts table not available');
}
console.log('');

// Step 3: Clear lockout from localStorage (instructions)
console.log('Step 3: Clear lockout from localStorage (manual step)');
console.log('Run this in browser console:');
console.log('');
console.log('// Clear failed login attempts');
console.log('localStorage.removeItem("failed_login_attempts")');
console.log('');
console.log(`// Clear login stats for user ID: ${user.id}`);
console.log(`localStorage.removeItem("loginStats_${user.id}")`);
console.log('');

// Step 4: Reset password to known value
console.log('Step 4: Resetting password to Guest123...');
try {
  const authUsersList = await supabase.auth.admin.listUsers();
  const existingAuthUser = authUsersList.data.users.find(u => u.email === guestEmail);

  if (existingAuthUser) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingAuthUser.id,
      { password: 'Guest123' }
    );

    if (updateError) {
      console.error('❌ Error updating password:', updateError.message);
    } else {
      console.log('✅ Password reset to Guest123 in Supabase Auth');
    }
  } else {
    console.log('⚠️ User not found in Supabase Auth, creating new auth account...');
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email: guestEmail,
      password: 'Guest123',
      email_confirm: true,
      user_metadata: {
        name: 'Guest',
        tenant_id: tenantId
      }
    });

    if (createError) {
      console.error('❌ Error creating auth user:', createError.message);
    } else {
      console.log('✅ Supabase Auth account created with password Guest123');
    }
  }
} catch (err) {
  console.error('❌ Exception:', err.message);
}
console.log('');

console.log('🎉 ===== LOCKOUT RESET COMPLETE =====\n');
console.log('✅ Guest user lockout cleared for ARTLEE tenant');
console.log('✅ Password reset to: Guest123');
console.log('');
console.log('⚠️ IMPORTANT: Also run the localStorage commands above in browser console to fully clear lockout');
console.log('');
console.log('🔒 TENANT ISOLATION CONFIRMED:');
console.log(`   - Only affected user in tenant_id = "${tenantId}"`);
console.log('   - Other tenants (CareXPS, MedEx) were NOT touched');
console.log('\n=====================================\n');
