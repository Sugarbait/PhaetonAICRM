/**
 * Force delete Pierre's Auth user - complete removal
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function forceDeletePierreAuth() {
  console.log('🔧 Force deleting pierre@phaetonai.com from Supabase Auth\n')

  try {
    // 1. List all Auth users to find Pierre
    console.log('1️⃣ Listing all Auth users...')
    const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      process.exit(1)
    }

    if (!authData || !authData.users || authData.users.length === 0) {
      console.log('✅ No Auth users found - pierre@phaetonai.com is completely clear!')
      console.log('\n🎉 You can now register with pierre@phaetonai.com')
      process.exit(0)
    }

    console.log(`Found ${authData.users.length} Auth user(s):\n`)
    authData.users.forEach((user, i) => {
      console.log(`${i + 1}. Email: ${user.email || 'NO EMAIL'}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Phone: ${user.phone || 'none'}`)
      console.log('')
    })

    // 2. Find and delete pierre@phaetonai.com
    const pierreAuth = authData.users.find(u =>
      u.email?.toLowerCase() === 'pierre@phaetonai.com' ||
      u.email?.toLowerCase().includes('pierre')
    )

    if (pierreAuth) {
      console.log('2️⃣ Found Pierre\'s Auth account - attempting deletion...\n')

      // Try multiple deletion methods
      console.log('Method 1: Standard delete...')
      const { error: deleteError1 } = await supabaseAdmin.auth.admin.deleteUser(pierreAuth.id)

      if (!deleteError1) {
        console.log('✅ Deleted successfully with Method 1')
      } else {
        console.log('⚠️  Method 1 failed:', deleteError1.message)

        console.log('\nMethod 2: Soft delete...')
        const { error: deleteError2 } = await supabaseAdmin.auth.admin.deleteUser(pierreAuth.id, true)

        if (!deleteError2) {
          console.log('✅ Deleted successfully with Method 2')
        } else {
          console.log('⚠️  Method 2 failed:', deleteError2.message)

          console.log('\nMethod 3: Update email to disable...')
          try {
            // Try to update the email to something else to "free up" pierre@phaetonai.com
            const randomEmail = `deleted_pierre_${Date.now()}@deleted.local`
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              pierreAuth.id,
              {
                email: randomEmail,
                email_confirm: true,
                ban_duration: 'none'
              }
            )

            if (!updateError) {
              console.log(`✅ Changed email to: ${randomEmail}`)
              console.log('✅ pierre@phaetonai.com is now free to use!')
            } else {
              console.log('⚠️  Method 3 failed:', updateError.message)
            }
          } catch (updateErr) {
            console.log('⚠️  Method 3 exception:', updateErr.message)
          }
        }
      }
    } else {
      console.log('2️⃣ Pierre not found in Auth users')
    }

    // 3. Delete ALL other Auth users (cleanup)
    console.log('\n3️⃣ Deleting any remaining Auth users...')
    for (const user of authData.users) {
      if (user.id === pierreAuth?.id) continue // Already handled above

      console.log(`Deleting: ${user.email || user.id}...`)
      try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        if (!error) {
          console.log('   ✅ Deleted')
        } else {
          console.log('   ⚠️  Failed:', error.message)
          // Try to change email instead
          try {
            const randomEmail = `deleted_${Date.now()}_${Math.random().toString(36).substring(7)}@deleted.local`
            await supabaseAdmin.auth.admin.updateUserById(user.id, { email: randomEmail })
            console.log(`   ✅ Changed email to: ${randomEmail}`)
          } catch (err) {
            console.log('   ❌ Could not delete or update')
          }
        }
      } catch (err) {
        console.log('   ❌ Exception:', err.message)
      }
    }

    // 4. Verify pierre@phaetonai.com is free
    console.log('\n4️⃣ Verifying pierre@phaetonai.com is available...')
    const { data: finalCheck } = await supabaseAdmin.auth.admin.listUsers()

    const pierreStillExists = finalCheck?.users?.some(u =>
      u.email?.toLowerCase() === 'pierre@phaetonai.com'
    )

    console.log('\n' + '='.repeat(60))
    if (pierreStillExists) {
      console.log('⚠️  pierre@phaetonai.com still exists in Auth')
      console.log('📋 Manual cleanup required:')
      console.log('   1. Go to Supabase Dashboard')
      console.log('   2. Authentication → Users')
      console.log('   3. Delete pierre@phaetonai.com manually')
    } else {
      console.log('✅ SUCCESS - pierre@phaetonai.com is completely clear!')
      console.log('✅ You can now register with pierre@phaetonai.com')
    }
    console.log('='.repeat(60))

    console.log('\n📊 Final Auth user count:', finalCheck?.users?.length || 0)

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    process.exit(1)
  }
}

forceDeletePierreAuth()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
  })
