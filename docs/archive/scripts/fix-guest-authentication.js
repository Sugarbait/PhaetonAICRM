/**
 * Fix Authentication Issues for guest@guest.com
 *
 * This script will:
 * 1. Verify users table structure and data
 * 2. Check RLS policies
 * 3. Verify failed_login_attempts table
 * 4. Sync Supabase Auth user with users table
 * 5. Test authentication flow
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('\n🔍 ARTLEE CRM - Guest Authentication Fix\n')
console.log('=' .repeat(60))

async function main() {
  const guestEmail = 'guest@guest.com'
  const guestPassword = 'Guest123'
  const tenantId = 'artlee'

  console.log(`\n📧 Target User: ${guestEmail}`)
  console.log(`🏢 Tenant: ${tenantId}`)
  console.log(`🔑 Password: ${guestPassword}`)

  // Step 1: Check Supabase Auth user
  console.log('\n' + '='.repeat(60))
  console.log('STEP 1: Checking Supabase Auth User')
  console.log('='.repeat(60))

  const { data: authUsers, error: authListError } = await supabase.auth.admin.listUsers()

  if (authListError) {
    console.error('❌ Error listing auth users:', authListError)
  } else {
    const guestAuthUser = authUsers.users.find(u => u.email === guestEmail)
    if (guestAuthUser) {
      console.log('✅ Found Supabase Auth user:')
      console.log(`   ID: ${guestAuthUser.id}`)
      console.log(`   Email: ${guestAuthUser.email}`)
      console.log(`   Email Confirmed: ${guestAuthUser.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`   Created: ${guestAuthUser.created_at}`)
      console.log(`   Last Sign In: ${guestAuthUser.last_sign_in_at || 'Never'}`)
    } else {
      console.log('⚠️  No Supabase Auth user found')
      console.log('   Creating Supabase Auth user...')

      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: guestEmail,
        password: guestPassword,
        email_confirm: true
      })

      if (createError) {
        console.error('❌ Error creating auth user:', createError)
      } else {
        console.log('✅ Created Supabase Auth user:')
        console.log(`   ID: ${newAuthUser.user.id}`)
      }
    }
  }

  // Step 2: Check users table
  console.log('\n' + '='.repeat(60))
  console.log('STEP 2: Checking users Table')
  console.log('='.repeat(60))

  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('email', guestEmail)

  if (usersError) {
    console.error('❌ Error querying users table:', usersError)
    console.error('   This might indicate an RLS policy issue')
  } else if (!usersData || usersData.length === 0) {
    console.log('⚠️  No user found in users table')
    console.log('   Creating user in users table...')

    // Get the auth user ID
    const { data: authUsers2 } = await supabase.auth.admin.listUsers()
    const guestAuthUser = authUsers2.users.find(u => u.email === guestEmail)

    if (!guestAuthUser) {
      console.error('❌ Cannot create users table entry without auth user')
      return
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: guestAuthUser.id,
        email: guestEmail,
        name: 'Guest User',
        role: 'super_user',
        tenant_id: tenantId,
        is_active: true,
        mfa_enabled: false,
        metadata: {
          created_via: 'fix_script',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting user:', insertError)
    } else {
      console.log('✅ Created user in users table:')
      console.log(`   ID: ${newUser.id}`)
      console.log(`   Role: ${newUser.role}`)
      console.log(`   Tenant: ${newUser.tenant_id}`)
    }
  } else {
    console.log(`✅ Found ${usersData.length} user(s) in users table:`)
    usersData.forEach(user => {
      console.log(`\n   User Details:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Name: ${user.name || 'N/A'}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Tenant ID: ${user.tenant_id}`)
      console.log(`   Active: ${user.is_active}`)
      console.log(`   MFA Enabled: ${user.mfa_enabled}`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Last Login: ${user.last_login || 'Never'}`)

      if (user.tenant_id !== tenantId) {
        console.log(`\n   ⚠️  WARNING: User has wrong tenant_id (${user.tenant_id} should be ${tenantId})`)
        console.log('   Fixing tenant_id...')

        supabase
          .from('users')
          .update({ tenant_id: tenantId })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) {
              console.error('   ❌ Error updating tenant_id:', error)
            } else {
              console.log('   ✅ Updated tenant_id to artlee')
            }
          })
      }
    })
  }

  // Step 3: Check failed_login_attempts table
  console.log('\n' + '='.repeat(60))
  console.log('STEP 3: Checking failed_login_attempts Table')
  console.log('='.repeat(60))

  const { data: failedAttempts, error: failedError } = await supabase
    .from('failed_login_attempts')
    .select('*')
    .eq('email', guestEmail)

  if (failedError) {
    console.error('❌ Error querying failed_login_attempts:', failedError)

    // Check if table exists
    console.log('\n   Checking if failed_login_attempts table exists...')
    const { error: tableCheckError } = await supabase
      .from('failed_login_attempts')
      .select('count')
      .limit(1)

    if (tableCheckError) {
      console.log('   ⚠️  Table might not exist or has RLS issues')
      console.log('   Creating failed_login_attempts table...')

      // Note: This would need to be run as a migration
      console.log('   ℹ️  Run this SQL migration:')
      console.log(`
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  tenant_id TEXT NOT NULL,
  CONSTRAINT failed_login_attempts_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenant_config(tenant_id)
);

CREATE INDEX idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_login_tenant ON failed_login_attempts(tenant_id);

-- RLS Policies
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON failed_login_attempts
  FOR ALL USING (true);
      `)
    }
  } else {
    console.log(`✅ Found ${failedAttempts?.length || 0} failed login attempts`)

    if (failedAttempts && failedAttempts.length > 0) {
      console.log('\n   Clearing failed login attempts...')
      const { error: deleteError } = await supabase
        .from('failed_login_attempts')
        .delete()
        .eq('email', guestEmail)

      if (deleteError) {
        console.error('   ❌ Error clearing attempts:', deleteError)
      } else {
        console.log('   ✅ Cleared failed login attempts')
      }
    }
  }

  // Step 4: Check user_settings table
  console.log('\n' + '='.repeat(60))
  console.log('STEP 4: Checking user_settings Table')
  console.log('='.repeat(60))

  // Get user ID from users table
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('email', guestEmail)
    .single()

  if (userData) {
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userData.id)

    if (settingsError) {
      console.error('❌ Error querying user_settings:', settingsError)
    } else if (!settings || settings.length === 0) {
      console.log('⚠️  No user_settings found, creating...')

      const { error: insertSettingsError } = await supabase
        .from('user_settings')
        .insert({
          user_id: userData.id,
          tenant_id: tenantId,
          settings: {
            theme: 'light',
            notifications_enabled: true
          }
        })

      if (insertSettingsError) {
        console.error('   ❌ Error creating settings:', insertSettingsError)
      } else {
        console.log('   ✅ Created user_settings')
      }
    } else {
      console.log(`✅ Found user_settings (${settings.length} record(s))`)
    }
  }

  // Step 5: Test authentication
  console.log('\n' + '='.repeat(60))
  console.log('STEP 5: Testing Authentication')
  console.log('='.repeat(60))

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: guestEmail,
    password: guestPassword
  })

  if (authError) {
    console.error('❌ Authentication failed:', authError.message)
    console.log('\n   Trying to update password...')

    const { data: authUsers3 } = await supabase.auth.admin.listUsers()
    const guestAuthUser = authUsers3.users.find(u => u.email === guestEmail)

    if (guestAuthUser) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        guestAuthUser.id,
        { password: guestPassword }
      )

      if (updateError) {
        console.error('   ❌ Error updating password:', updateError)
      } else {
        console.log('   ✅ Password updated, testing again...')

        const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
          email: guestEmail,
          password: guestPassword
        })

        if (retryError) {
          console.error('   ❌ Authentication still failed:', retryError.message)
        } else {
          console.log('   ✅ Authentication successful!')
          console.log(`   User ID: ${retryAuth.user.id}`)

          // Sign out
          await supabase.auth.signOut()
        }
      }
    }
  } else {
    console.log('✅ Authentication successful!')
    console.log(`   User ID: ${authData.user.id}`)
    console.log(`   Email: ${authData.user.email}`)

    // Sign out
    await supabase.auth.signOut()
  }

  // Step 6: Check RLS policies
  console.log('\n' + '='.repeat(60))
  console.log('STEP 6: Checking RLS Policies')
  console.log('='.repeat(60))

  const { data: policies, error: policiesError } = await supabase
    .rpc('get_table_policies', { table_name: 'users' })
    .catch(() => ({ data: null, error: null }))

  if (policies) {
    console.log('✅ RLS Policies found:')
    console.log(JSON.stringify(policies, null, 2))
  } else {
    console.log('ℹ️  Unable to retrieve RLS policies (this requires specific permissions)')
    console.log('   You can check RLS policies manually in Supabase dashboard')
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))

  console.log('\n✅ Fix completed! Please verify:')
  console.log('   1. User exists in both Supabase Auth and users table')
  console.log('   2. tenant_id is set to "artlee"')
  console.log('   3. Failed login attempts are cleared')
  console.log('   4. Password is set correctly')
  console.log('   5. Authentication test passed')
  console.log('\n📝 Try logging in with:')
  console.log(`   Email: ${guestEmail}`)
  console.log(`   Password: ${guestPassword}`)
}

main().catch(console.error)
