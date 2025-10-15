import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

async function investigateRolePersistence() {
  console.log('=== INVESTIGATING ROLE PERSISTENCE ISSUE ===\n')

  // Query all ARTLEE users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('tenant_id', 'artlee')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Database Error:', error)
    return
  }

  console.log(`Found ${users.length} ARTLEE users:\n`)

  users.forEach((user, index) => {
    console.log(`\n[User ${index + 1}]`)
    console.log('Email:', user.email)
    console.log('Name:', user.name)
    console.log('Role (DB field):', user.role)
    console.log('Metadata:', JSON.stringify(user.metadata, null, 2))
    console.log('Is Active:', user.is_active)
    console.log('Created:', user.created_at)
    console.log('Updated:', user.updated_at)
    console.log('-'.repeat(50))
  })

  // Check if metadata.original_role exists for any users
  const usersWithMetadata = users.filter(u => u.metadata && u.metadata.original_role)
  console.log(`\n${usersWithMetadata.length} users have metadata.original_role set`)

  if (usersWithMetadata.length > 0) {
    console.log('\nUsers with metadata.original_role:')
    usersWithMetadata.forEach(u => {
      console.log(`  - ${u.email}: role=${u.role}, metadata.original_role=${u.metadata.original_role}`)
    })
  }

  // Test case: Try to promote a test user
  console.log('\n=== TESTING ROLE UPDATE ===')
  const testUser = users.find(u => u.email === 'guest@guest.com')

  if (testUser) {
    console.log(`\nFound test user: ${testUser.email}`)
    console.log(`Current role: ${testUser.role}`)
    console.log(`Current metadata:`, testUser.metadata)

    // Simulate the update that happens in updateUserProfile
    const newRole = 'super_user'
    const existingMetadata = testUser.metadata || {}
    const updatedMetadata = {
      ...existingMetadata,
      original_role: newRole
    }

    console.log(`\nAttempting to update to super_user...`)
    console.log(`New metadata:`, updatedMetadata)

    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({
        role: newRole,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', 'artlee')
      .eq('id', testUser.id)
      .select()

    if (updateError) {
      console.error('Update Error:', updateError)
    } else {
      console.log('Update Success!')
      console.log('Updated user:', updateResult)

      // Verify the update persisted
      console.log('\n=== VERIFYING UPDATE ===')
      const { data: verifyUser, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUser.id)
        .single()

      if (verifyError) {
        console.error('Verification Error:', verifyError)
      } else {
        console.log('Verified user from DB:')
        console.log('  Role:', verifyUser.role)
        console.log('  Metadata:', JSON.stringify(verifyUser.metadata, null, 2))
      }
    }
  } else {
    console.log('Test user guest@guest.com not found')
  }
}

investigateRolePersistence()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script Error:', err)
    process.exit(1)
  })
