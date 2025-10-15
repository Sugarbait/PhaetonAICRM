import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

const TENANT_ID = 'phaeton_ai'

async function testRoleFix() {
  console.log('=== TESTING ROLE PERSISTENCE FIX ===\n')

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

  console.log('BEFORE: test@test.com')
  console.log('  Role:', testUser.role)
  console.log('  Is Active:', testUser.is_active)

  // Promote to super_user (WITHOUT metadata)
  console.log('\n=== Promoting to super_user (no metadata) ===')
  const { data: updateResult, error: updateError } = await supabase
    .from('users')
    .update({
      role: 'super_user',
      updated_at: new Date().toISOString()
    })
    .eq('tenant_id', TENANT_ID)
    .eq('id', testUser.id)
    .select()

  if (updateError) {
    console.error('❌ Update Error:', updateError)
    return
  }

  console.log('✅ Update successful!')
  console.log('Returned data:', updateResult[0])

  // Verify immediately
  console.log('\n=== Immediate Verification ===')
  const { data: verify1, error: verifyError1 } = await supabase
    .from('users')
    .select('*')
    .eq('id', testUser.id)
    .single()

  if (verifyError1) {
    console.error('Verification Error:', verifyError1)
  } else {
    console.log('User data after update:')
    console.log('  Role:', verify1.role)
    console.log('  ✅ SUCCESS: Role is now', verify1.role)
  }

  // Simulate page refresh (2s delay)
  console.log('\n=== Simulating Page Refresh (2s delay) ===')
  await new Promise(resolve => setTimeout(resolve, 2000))

  const { data: verify2, error: verifyError2 } = await supabase
    .from('users')
    .select('*')
    .eq('id', testUser.id)
    .single()

  if (verifyError2) {
    console.error('Verification Error:', verifyError2)
  } else {
    console.log('User data after simulated refresh:')
    console.log('  Role:', verify2.role)

    if (verify2.role === 'super_user') {
      console.log('  ✅ SUCCESS: Role persisted after refresh!')
    } else {
      console.log('  ❌ FAILURE: Role reverted to', verify2.role)
    }
  }

  // Test loadSystemUsers query
  console.log('\n=== Testing loadSystemUsers Query ===')
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

    if (testUserFromList?.role === 'super_user') {
      console.log('  ✅ SUCCESS: Role is correct in loadSystemUsers!')
    } else {
      console.log('  ❌ FAILURE: Role is wrong in loadSystemUsers')
    }
  }

  // Reset back to 'user' for cleanup
  console.log('\n=== Cleanup: Resetting role to "user" ===')
  await supabase
    .from('users')
    .update({
      role: 'user',
      updated_at: new Date().toISOString()
    })
    .eq('id', testUser.id)

  console.log('✅ Test complete and cleaned up')
}

testRoleFix()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script Error:', err)
    process.exit(1)
  })
