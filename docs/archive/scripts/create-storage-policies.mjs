#!/usr/bin/env node

/**
 * Automatically Create Storage Policies
 * This script uses Supabase Management API to create storage policies
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

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

console.log('🔧 Creating Storage Policies...\n')
console.log('=' .repeat(60))

// Policy definitions
const policies = [
  {
    name: 'allow_authenticated_uploads',
    definition: `(bucket_id = 'company-logos')`,
    check: `(bucket_id = 'company-logos')`,
    command: 'ALL',
    roles: ['authenticated']
  },
  {
    name: 'allow_public_read',
    definition: `(bucket_id = 'company-logos')`,
    check: null,
    command: 'SELECT',
    roles: ['public']
  }
]

async function createStoragePolicy(policy) {
  console.log(`\n📋 Creating policy: ${policy.name}`)
  console.log('-'.repeat(60))

  try {
    // Using raw SQL to create policies
    const sql = `
      -- Drop if exists
      DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;

      -- Create new policy
      CREATE POLICY "${policy.name}"
        ON storage.objects
        FOR ${policy.command}
        TO ${policy.roles.join(', ')}
        USING (${policy.definition})
        ${policy.check ? `WITH CHECK (${policy.check})` : ''};
    `

    // Execute via Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { query: sql })

    if (error) {
      // Try alternative approach using storage API
      console.log('⚠️  Direct SQL failed, trying storage API...')

      // This approach won't work for policies, but let's try
      throw new Error('Cannot create policies via API - must use Dashboard UI or SQL Editor')
    }

    console.log(`✅ Policy created successfully: ${policy.name}`)
  } catch (err) {
    console.error(`❌ Failed to create policy: ${err.message}`)
    console.log('\n🔧 ALTERNATIVE: You need to create this policy manually via Supabase Dashboard:')
    console.log(`   1. Go to Storage > Policies`)
    console.log(`   2. Click "New Policy"`)
    console.log(`   3. Choose "For full customization"`)
    console.log(`   4. Enter:`)
    console.log(`      - Name: ${policy.name}`)
    console.log(`      - Command: ${policy.command}`)
    console.log(`      - Target roles: ${policy.roles.join(', ')}`)
    console.log(`      - USING: ${policy.definition}`)
    if (policy.check) {
      console.log(`      - WITH CHECK: ${policy.check}`)
    }
  }
}

// Create all policies
for (const policy of policies) {
  await createStoragePolicy(policy)
}

console.log('\n\n' + '='.repeat(60))
console.log('📊 SUMMARY')
console.log('='.repeat(60))

console.log('\n⚠️  IMPORTANT: Storage policies cannot be created programmatically')
console.log('You MUST use the Supabase Dashboard UI to create these policies.\n')

console.log('📋 Quick Steps:')
console.log('1. Go to: https://supabase.com/dashboard/project/cpkslvmydfdevdftieck/storage/policies')
console.log('2. Click "New Policy" button')
console.log('3. Choose "For full customization"')
console.log('\n4. Create Policy #1:')
console.log('   - Name: allow_authenticated_uploads')
console.log('   - Command: ALL (check all boxes)')
console.log('   - Target roles: authenticated')
console.log('   - USING: bucket_id = \'company-logos\'')
console.log('   - WITH CHECK: bucket_id = \'company-logos\'')
console.log('\n5. Create Policy #2:')
console.log('   - Name: allow_public_read')
console.log('   - Command: SELECT only')
console.log('   - Target roles: public')
console.log('   - USING: bucket_id = \'company-logos\'')

console.log('\n✅ After creating these policies, logos will upload to cloud storage!')
console.log('')
