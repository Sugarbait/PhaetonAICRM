import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

const TENANT_ID = 'phaeton_ai'

async function testRolePromotion() {
  console.log('=== TESTING ROLE PROMOTION ===\n')

  // Find test@test.com user
  const { data: testUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('email', 'test@test.com')
    .single()

  if (fetchError) {
    console.error('Error fetching test user:', fetchError)
    return
  }

  console.log('Found test user:')
  console.log('  Email:', testUser.email)
  console.log('  Current Role:', testUser.role)
  console.log('  Current Metadata:', testUser.metadata)
  console.log('  Is Active:', testUser.is_active)

  // Promote to super_user
  console.log('\n=== STEP 1: Promoting to super_user ===')
  const newRole = 'super_user'
  const existingMetadata = testUser.metadata || {}
  const updatedMetadata = {
    ...existingMetadata,
    original_role: newRole
  }

  console.log('Updating with:')
  console.log('  New Role:', newRole)
  console.log('  New Metadata:', updatedMetadata)

  const { data: updateResult, error: updateError } = await supabase
    .from('users')
    .update({
      role: newRole,
      metadata: updatedMetadata,
      updated_at: new Date().toISOString()
    })
    .eq('tenant_id', TENANT_ID)
    .eq('id', testUser.id)
    .select()

  if (updateError) {
    console.error('Update Error:', updateError)
    return
  }

  console.log('Update successful!')
  console.log('Returned data:', updateResult)

  // Verify immediately
  console.log('\n=== STEP 2: Immediate Verification ===')
  const { data: verifyUser1, error: verifyError1 } = await supabase
    .from('users')
    .select('*')
    .eq('id', testUser.id)
    .single()

  if (verifyError1) {
    console.error('Verification Error:', verifyError1)
  } else {
    console.log('User data immediately after update:')
    console.log('  Role:', verifyUser1.role)
    console.log('  Metadata:', JSON.stringify(verifyUser1.metadata, null, 2))
  }

  // Wait 2 seconds and verify again (simulate page refresh)
  console.log('\n=== STEP 3: Simulating Page Refresh (2s delay) ===')
  await new Promise(resolve => setTimeout(resolve, 2000))

  const { data: verifyUser2, error: verifyError2 } = await supabase
    .from('users')
    .select('*')
    .eq('id', testUser.id)
    .single()

  if (verifyError2) {
    console.error('Verification Error:', verifyError2)
  } else {
    console.log('User data after simulated refresh:')
    console.log('  Role:', verifyUser2.role)
    console.log('  Metadata:', JSON.stringify(verifyUser2.metadata, null, 2))
  }

  // Check loadSystemUsers behavior
  console.log('\n=== STEP 4: Testing loadSystemUsers Query ===')
  const { data: allUsers, error: loadError } = await supabase
    .from('users')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (loadError) {
    console.error('Load Error:', loadError)
  } else {
    const testUserFromList = allUsers.find(u => u.email === 'test@test.com')
    console.log('test@test.com in loadSystemUsers result:')
    console.log('  Role:', testUserFromList?.role)
    console.log('  Metadata:', JSON.stringify(testUserFromList?.metadata, null, 2))
  }

  // Test the role mapping logic
  console.log('\n=== STEP 5: Testing Role Mapping Logic ===')
  const dbRole = verifyUser2.role
  const metadataRole = verifyUser2.metadata?.original_role
  const finalRole = metadataRole || dbRole

  console.log('Role mapping:')
  console.log('  DB role field:', dbRole)
  console.log('  metadata.original_role:', metadataRole)
  console.log('  Final role (what app should show):', finalRole)

  // Reset role back to 'user' for next test
  console.log('\n=== CLEANUP: Resetting role to "user" ===')
  await supabase
    .from('users')
    .update({
      role: 'user',
      metadata: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', testUser.id)

  console.log('✅ Test complete and cleaned up')
}

testRolePromotion()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script Error:', err)
    process.exit(1)
  })
