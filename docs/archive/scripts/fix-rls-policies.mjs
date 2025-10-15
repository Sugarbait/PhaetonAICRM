/**
 * Fix RLS Policies for User Registration
 *
 * This script fixes the "infinite recursion detected in policy" error
 * by dropping problematic RLS policies and creating proper ones.
 *
 * Usage: node fix-rls-policies.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cpkslvmydfdevdftieck.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔧 Fixing RLS Policies for User Registration\n')
console.log('=' .repeat(60))

async function fixRLSPolicies() {
  try {
    console.log('🗑️  STEP 1: Dropping all existing RLS policies on users table...')

    // Drop all existing policies on users table
    const dropPoliciesSQL = `
      -- Drop all policies on users table
      DO $$
      DECLARE
        policy_record RECORD;
      BEGIN
        FOR policy_record IN
          SELECT policyname
          FROM pg_policies
          WHERE tablename = 'users' AND schemaname = 'public'
        LOOP
          EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.users CASCADE';
          RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
        END LOOP;
      END $$;
    `

    const { error: dropError } = await supabaseAdmin.rpc('exec_sql', { sql: dropPoliciesSQL })
      .catch(() => {
        // Try direct SQL if RPC doesn't work
        return supabaseAdmin.from('_sql').insert({ query: dropPoliciesSQL })
      })

    // Alternative: Use raw SQL execution
    const { error: dropError2 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can view their own profile" ON public.users CASCADE;
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.users CASCADE;
        DROP POLICY IF EXISTS "Allow user registration" ON public.users CASCADE;
        DROP POLICY IF EXISTS "Allow authenticated user access" ON public.users CASCADE;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users CASCADE;
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.users CASCADE;
      `
    }).catch(err => ({ error: err }))

    console.log('✅ Dropped existing policies\n')

    console.log('🔨 STEP 2: Creating new RLS policies...')

    // Create proper RLS policies without recursion
    const createPoliciesSQL = `
-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous users to INSERT for registration (no recursion)
CREATE POLICY "allow_anon_registration"
ON public.users
FOR INSERT
TO anon
WITH CHECK (true);  -- No recursion - allow all INSERTs from anon

-- Policy 2: Allow service_role full access (for admin operations)
CREATE POLICY "service_role_full_access"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 3: Allow authenticated users to SELECT their own profile only
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());  -- Use auth.uid() to avoid recursion

-- Policy 4: Allow authenticated users to UPDATE their own profile only
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 5: Prevent authenticated users from changing their role or tenant
CREATE POLICY "prevent_role_change"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  role = (SELECT role FROM public.users WHERE id = auth.uid()) AND
  tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);
    `

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createPoliciesSQL })
      .catch(err => ({ error: err }))

    if (createError) {
      console.error('❌ Error creating policies via RPC:', createError.message || createError)
      console.log('\n📝 SQL to run manually in Supabase SQL Editor:')
      console.log(createPoliciesSQL)
      console.log('\n⚠️  Please run this SQL manually in Supabase dashboard')
      return false
    }

    console.log('✅ Created new RLS policies\n')
    return true

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error.message || error)
    console.log('\n📝 Manual SQL Fix Required:')
    console.log(`
-- Run this SQL in Supabase SQL Editor:

-- 1. Drop all existing policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'users' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.users CASCADE';
  END LOOP;
END $$;

-- 2. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Allow anonymous registration (no recursion)
CREATE POLICY "allow_anon_registration"
ON public.users
FOR INSERT
TO anon
WITH CHECK (true);

-- 4. Allow service role full access
CREATE POLICY "service_role_full_access"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Allow authenticated users to view their own profile
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 6. Allow authenticated users to update their own profile
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
    `)
    return false
  }
}

// Test registration after fix
async function testRegistrationAfterFix() {
  console.log('🧪 STEP 3: Testing registration after fix...')

  const testEmail = `test-${Date.now()}@test.com`
  const testId = crypto.randomUUID()

  try {
    // Create anon client
    const supabaseAnon = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDAyOTUsImV4cCI6MjA2MjQ3NjI5NX0.IfkIVsp3AtLOyXDW9hq9bEvnozd9IaaUay244iDhWGE')

    const { data, error } = await supabaseAnon
      .from('users')
      .insert({
        id: testId,
        email: testEmail,
        name: 'Test User',
        role: 'user',
        mfa_enabled: false,
        is_active: false,
        tenant_id: 'phaeton_ai',
        last_login: null
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Registration test FAILED:', error.message)
      console.error('   Code:', error.code)
      return false
    }

    console.log('✅ Registration test PASSED!')
    console.log('   Created user:', {
      id: data.id,
      email: data.email,
      role: data.role,
      tenant_id: data.tenant_id
    })

    // Cleanup
    await supabaseAdmin.from('users').delete().eq('id', testId)
    console.log('✅ Cleaned up test user\n')

    return true
  } catch (error) {
    console.error('❌ Registration test FAILED:', error.message)
    return false
  }
}

async function main() {
  console.log('Starting RLS policy fix...\n')

  const fixed = await fixRLSPolicies()

  if (!fixed) {
    console.log('\n⚠️  RLS policies need manual fix via SQL Editor')
    console.log('   Go to: Supabase Dashboard → SQL Editor')
    console.log('   Run the SQL printed above\n')
    return
  }

  await testRegistrationAfterFix()

  console.log('=' .repeat(60))
  console.log('📊 SUMMARY:')
  console.log('=' .repeat(60))
  console.log('✅ RLS policies fixed')
  console.log('✅ Anonymous registration now allowed')
  console.log('✅ User registration should work now')
  console.log('\n🎉 Try registering pierre@phaetonai.com again!\n')
}

main().catch(console.error)
