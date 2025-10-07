import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🏢 ===== ARTLEE CRM USER PROFILES =====\n');

// Fetch all ARTLEE users
const { data: users, error } = await supabase
  .from('users')
  .select('*')
  .eq('tenant_id', 'artlee')
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Error fetching users:', error.message);
  process.exit(1);
}

if (!users || users.length === 0) {
  console.log('📭 No users found for ARTLEE tenant');
  console.log('\n✅ This is expected for a fresh installation.');
  console.log('💡 First user to register will automatically become Super User.\n');
  process.exit(0);
}

console.log(`📊 Total Users: ${users.length}\n`);

users.forEach((user, index) => {
  console.log(`👤 User ${index + 1}:`);
  console.log(`   Email:        ${user.email}`);
  console.log(`   Name:         ${user.name || '(not set)'}`);
  console.log(`   Username:     ${user.username || '(not set)'}`);
  console.log(`   Role:         ${user.role}`);
  console.log(`   Tenant ID:    ${user.tenant_id}`);
  console.log(`   Active:       ${user.is_active ? 'Yes' : 'No'}`);
  console.log(`   MFA Enabled:  ${user.mfa_enabled ? 'Yes' : 'No'}`);
  console.log(`   Last Login:   ${user.last_login || '(never)'}`);
  console.log(`   Created:      ${user.created_at}`);
  console.log(`   Azure AD ID:  ${user.azure_ad_id || '(not set)'}`);

  if (user.metadata) {
    console.log(`   Metadata:     ${JSON.stringify(user.metadata, null, 2)}`);
  }

  console.log('');
});

// Summary by role
const roleCount = users.reduce((acc, user) => {
  acc[user.role] = (acc[user.role] || 0) + 1;
  return acc;
}, {});

console.log('📈 Users by Role:');
Object.entries(roleCount).forEach(([role, count]) => {
  console.log(`   ${role}: ${count}`);
});

console.log('\n🏢 =====================================\n');
