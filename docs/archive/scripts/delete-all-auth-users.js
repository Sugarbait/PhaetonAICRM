/**
 * Force Delete ALL Supabase Auth Users
 * This deletes EVERY user from Supabase Auth
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
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function deleteAllAuthUsers() {
  console.log('🗑️  Force deleting ALL Supabase Auth users...\n')

  try {
    // List all users
    const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return
    }

    if (!authData || !authData.users || authData.users.length === 0) {
      console.log('✅ No Auth users found - already clean!')
      return
    }

    console.log(`Found ${authData.users.length} Auth user(s):\n`)
    authData.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ID: ${user.id}`)
    })

    console.log('\n🗑️  Deleting users one by one...\n')

    for (const user of authData.users) {
      console.log(`Deleting: ${user.email}...`)

      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

        if (deleteError) {
          console.log(`   ❌ Failed: ${deleteError.message}`)

          // Try alternative deletion method
          console.log(`   🔄 Trying alternative method...`)
          try {
            await supabaseAdmin.auth.admin.deleteUser(user.id, true) // shouldSoftDelete = true
            console.log(`   ✅ Deleted with soft delete`)
          } catch (altErr) {
            console.log(`   ❌ Alternative method also failed`)
          }
        } else {
          console.log(`   ✅ Deleted successfully`)
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`)
      }
    }

    // Verify deletion
    console.log('\n🔍 Verifying deletion...')
    const { data: remainingData } = await supabaseAdmin.auth.admin.listUsers()
    console.log(`Remaining Auth users: ${remainingData?.users?.length || 0}`)

    if (remainingData?.users?.length === 0) {
      console.log('\n✅ ALL AUTH USERS DELETED!')
    } else {
      console.log('\n⚠️  Some users may remain')
      console.log('💡 You may need to delete them manually in Supabase Dashboard:')
      console.log('   Authentication → Users → Delete each user')
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

deleteAllAuthUsers()
  .then(() => {
    console.log('\n✅ Script complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Script failed:', err)
    process.exit(1)
  })
