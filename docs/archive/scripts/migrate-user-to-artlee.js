/**
 * Migrate User to ARTLEE Tenant
 *
 * This script migrates a user from another tenant to ARTLEE
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import readline from 'readline'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function migrateUserToArtlee() {
  try {
    const email = await question('Enter the email address of the user to migrate: ')

    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address')
      rl.close()
      return
    }

    console.log(`\n🔍 Looking for user: ${email}`)

    // Find the user
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim())

    if (findError) {
      console.error('❌ Error finding user:', findError)
      rl.close()
      return
    }

    if (!users || users.length === 0) {
      console.error(`❌ No user found with email: ${email}`)
      rl.close()
      return
    }

    const user = users[0]

    console.log(`\n👤 Found User:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name || user.username}`)
    console.log(`   Current Tenant: ${user.tenant_id}`)
    console.log(`   Current Role: ${user.role}`)

    if (user.tenant_id === 'artlee') {
      console.log('\n✅ User is already in ARTLEE tenant!')

      // Check if they should be super_user (first ARTLEE user)
      const { data: artleeUsers } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', 'artlee')

      if (artleeUsers && artleeUsers.length === 1 && user.role !== 'super_user') {
        console.log('\n🔄 This is the only ARTLEE user - updating to super_user...')

        await supabase
          .from('users')
          .update({ role: 'super_user', is_active: true })
          .eq('id', user.id)

        console.log('✅ Updated to super_user role!')
      }

      rl.close()
      return
    }

    const confirm = await question(`\n⚠️  Migrate this user from '${user.tenant_id}' to 'artlee' tenant? (yes/no): `)

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Migration cancelled')
      rl.close()
      return
    }

    // Check if there are any existing ARTLEE users
    const { data: existingArtlee } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', 'artlee')

    const isFirstArtleeUser = !existingArtlee || existingArtlee.length === 0

    console.log(`\n🔄 Migrating user to ARTLEE tenant...`)

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        tenant_id: 'artlee',
        role: isFirstArtleeUser ? 'super_user' : user.role,
        is_active: true
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      rl.close()
      return
    }

    // Update user_settings if they exist
    await supabase
      .from('user_settings')
      .update({ tenant_id: 'artlee' })
      .eq('user_id', user.id)

    // Update audit_logs
    await supabase
      .from('audit_logs')
      .update({ tenant_id: 'artlee' })
      .eq('user_id', user.id)

    // Update notes
    await supabase
      .from('notes')
      .update({ tenant_id: 'artlee' })
      .eq('user_id', user.id)

    console.log('✅ Successfully migrated user to ARTLEE tenant!')
    console.log('\n👑 User Details:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Tenant: artlee`)
    console.log(`   Role: ${isFirstArtleeUser ? 'super_user (first ARTLEE user)' : user.role}`)
    console.log(`   Status: Active`)
    console.log('\n🎉 Migration complete!')

    rl.close()

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    rl.close()
  }
}

migrateUserToArtlee()
