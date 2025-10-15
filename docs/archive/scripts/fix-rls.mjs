import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 FIXING RLS INFINITE RECURSION')
console.log('='.repeat(60))
console.log()

async function fixRLSRecursion() {
  try {
    // Step 1: Drop ALL existing SELECT policies
    console.log('📋 Step 1: Dropping all existing SELECT policies on users table...')

    const policiesToDrop = [
      'Users can read own data and public info',
      'Users can read all with anon key',
      'Allow anon read for login',
      'Users SELECT policy',
      'Public users are viewable by everyone'
    ]

    for (const policyName of policiesToDrop) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policyName}" ON public.users;`
        })

        if (!error) {
          console.log(`✅ Dropped policy: ${policyName}`)
        }
      } catch (err) {
        // Policy might not exist, that's fine
        console.log(`⚠️  Policy may not exist: ${policyName}`)
      }
    }

    // Alternative approach: Use direct SQL execution
    console.log('\n📋 Step 2: Using direct SQL to drop policies...')

    const dropPoliciesSQL = policiesToDrop
      .map(name => `DROP POLICY IF EXISTS "${name}" ON public.users;`)
      .join('\n')

    console.log('SQL to execute:')
    console.log(dropPoliciesSQL)
    console.log()

    // Step 3: Create new simple policy
    console.log('📋 Step 3: Creating new simple SELECT policy...')

    const createPolicySQL = `
-- Allow unauthenticated SELECT for login (no recursion)
CREATE POLICY "Allow unauthenticated SELECT for login"
ON public.users
FOR SELECT
USING (true);
`

    console.log('Policy SQL:')
    console.log(createPolicySQL)
    console.log()

    console.log('❗ MANUAL ACTION REQUIRED:')
    console.log('=' .repeat(60))
    console.log('The Supabase JS client cannot execute DDL commands.')
    console.log('Please run the following SQL in Supabase SQL Editor:')
    console.log()
    console.log('1. Go to: https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/sql/new')
    console.log()
    console.log('2. Copy and paste this SQL:')
    console.log('=' .repeat(60))
    console.log()
    console.log('-- Drop all existing SELECT policies')
    console.log(dropPoliciesSQL)
    console.log()
    console.log('-- Create new simple policy')
    console.log(createPolicySQL)
    console.log()
    console.log('-- Verify the policy was created')
    console.log(`SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
  AND cmd = 'SELECT';`)
    console.log()
    console.log('=' .repeat(60))
    console.log()
    console.log('3. Click "Run" to execute the SQL')
    console.log()
    console.log('4. Verify you see the new policy in the results')
    console.log()

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

fixRLSRecursion()
  .then(() => {
    console.log('\n📝 NEXT STEPS AFTER FIXING RLS:')
    console.log('1. Run the SQL in Supabase Dashboard')
    console.log('2. Run: node test-load-users.mjs')
    console.log('3. Verify anon key can see users')
    console.log('4. Try logging in with pierre@phaetonai.com')
    console.log()
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
