/**
 * Fix Tenant ID Values in Database (Auto-run version)
 *
 * This script corrects tenant_id values for users that were created with the wrong tenant.
 *
 * Problem: Users created in ARTLEE and MedEx were stored with tenant_id = 'carexps'
 * Solution: Update these users to have the correct tenant_id
 *
 * Usage: node fix-tenant-ids-auto.js
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
  console.error('❌ ERROR: Missing Supabase credentials in .env.local')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// User corrections to apply
const corrections = [
  { email: 'artlee@email.com', correctTenantId: 'artlee', currentTenantId: 'carexps' },
  { email: 'medex@email.com', correctTenantId: 'medex', currentTenantId: 'carexps' }
]

console.log('\n🔧 FIX TENANT_ID VALUES IN DATABASE (AUTO-RUN)\n')
console.log('=' .repeat(80))
console.log('\n📋 Planned corrections:')
corrections.forEach(c => {
  console.log(`   • ${c.email}: "${c.currentTenantId}" → "${c.correctTenantId}"`)
})
console.log('\n')

async function runFix() {
  console.log('🔍 Step 1: Verifying current state...\n')

  try {
    // Verify current state for each user
    const verifications = []
    for (const correction of corrections) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, tenant_id')
        .eq('email', correction.email)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`   ⚠️  User not found: ${correction.email}`)
          continue
        }
        throw error
      }

      console.log(`   Found: ${data.email}`)
      console.log(`      Current tenant_id: "${data.tenant_id}"`)
      console.log(`      Target tenant_id: "${correction.correctTenantId}"`)

      if (data.tenant_id === correction.correctTenantId) {
        console.log(`      ✅ Already correct, skipping\n`)
      } else {
        console.log(`      ⚠️  Needs update\n`)
        verifications.push({ ...correction, userId: data.id, needsUpdate: true })
      }
    }

    if (verifications.length === 0) {
      console.log('\n✅ All tenant_id values are already correct. No updates needed.\n')
      return
    }

    // Apply updates
    console.log('🔄 Step 2: Applying updates...\n')

    let successCount = 0
    let errorCount = 0

    for (const update of verifications) {
      if (!update.needsUpdate) continue

      console.log(`   Updating ${update.email}...`)

      const { error } = await supabase
        .from('users')
        .update({ tenant_id: update.correctTenantId })
        .eq('id', update.userId)

      if (error) {
        console.log(`      ❌ Update failed: ${error.message}\n`)
        errorCount++
      } else {
        console.log(`      ✅ Updated to tenant_id = "${update.correctTenantId}"\n`)
        successCount++
      }
    }

    // Verify updates
    console.log('🔍 Step 3: Verifying updates...\n')

    const emails = corrections.map(c => c.email)
    const { data: verifiedUsers, error: verifyError } = await supabase
      .from('users')
      .select('email, tenant_id')
      .in('email', emails)
      .order('email')

    if (verifyError) {
      console.error('   ❌ Verification query failed:', verifyError.message)
    } else {
      console.log('   📊 Current state after updates:')
      console.table(verifiedUsers)
    }

    // Check CareXPS users to confirm isolation
    console.log('\n🔍 Step 4: Verifying CareXPS user isolation...\n')

    const { data: carexpsUsers, error: carexpsError } = await supabase
      .from('users')
      .select('email, tenant_id')
      .eq('tenant_id', 'carexps')
      .order('email')

    if (carexpsError) {
      console.error('   ❌ CareXPS query failed:', carexpsError.message)
    } else {
      console.log('   📊 Users visible in CareXPS (tenant_id = "carexps"):')
      if (carexpsUsers.length === 0) {
        console.log('      No users found!')
      } else {
        console.table(carexpsUsers)
      }

      // Verify artlee and medex are NOT in the list
      const hasArtlee = carexpsUsers.some(u => u.email === 'artlee@email.com')
      const hasMedex = carexpsUsers.some(u => u.email === 'medex@email.com')

      if (!hasArtlee && !hasMedex) {
        console.log('\n   ✅ SUCCESS: artlee@email.com and medex@email.com are NOT visible in CareXPS')
      } else {
        if (hasArtlee) console.log('\n   ❌ ERROR: artlee@email.com is still visible in CareXPS!')
        if (hasMedex) console.log('   ❌ ERROR: medex@email.com is still visible in CareXPS!')
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(80))
    console.log('\n✅ UPDATE COMPLETE\n')
    console.log('📊 Summary:')
    console.log(`   • Successful updates: ${successCount}`)
    console.log(`   • Failed updates: ${errorCount}`)
    console.log(`   • Total processed: ${verifications.length}`)

    if (successCount > 0) {
      console.log('\n🎯 Verification Steps:')
      console.log('   1. In CareXPS User Management, verify:')
      console.log('      - artlee@email.com is NOT visible')
      console.log('      - medex@email.com is NOT visible')
      console.log('      - Only CareXPS users are visible (guest@email.com, etc.)')
      console.log('   2. In ARTLEE User Management, verify:')
      console.log('      - artlee@email.com IS visible')
      console.log('   3. In MedEx User Management, verify:')
      console.log('      - medex@email.com IS visible')
    }

    console.log('\n')

  } catch (error) {
    console.error('\n❌ Script failed:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

runFix().catch(error => {
  console.error('\n❌ Unhandled error:', error)
  process.exit(1)
})
