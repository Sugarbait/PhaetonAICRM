import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cpkslvmydfdevdftieck.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI5NSwiZXhwIjoyMDYyNDc2Mjk1fQ.5Nwr-DrgL63DwPMH2egxgdjoHGhAxCvIrz2SMTMKqD0'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testApproveUser() {
  const userId = 'a5a5337a-4369-415c-9cb6-eb01b4034131'
  const tenantId = 'phaeton_ai'

  console.log(`\n🧪 Testing User Approval with service_role key\n`)
  console.log(`User ID: ${userId}`)
  console.log(`Tenant ID: ${tenantId}\n`)

  // Step 1: Check user exists and current state
  console.log('Step 1: Checking user current state...')
  const { data: beforeUser, error: beforeError } = await supabaseAdmin
    .from('users')
    .select('id, email, tenant_id, is_active, role')
    .eq('id', userId)
    .single()

  if (beforeError) {
    console.error('❌ Error fetching user:', beforeError)
    return
  }

  if (!beforeUser) {
    console.error('❌ User not found!')
    return
  }

  console.log('✅ User found:')
  console.log('   Email:', beforeUser.email)
  console.log('   Tenant ID:', beforeUser.tenant_id)
  console.log('   Is Active (before):', beforeUser.is_active)
  console.log('   Role:', beforeUser.role)
  console.log()

  // Step 2: Approve the user (set is_active = true)
  console.log('Step 2: Approving user with service_role key...')
  const { data: updatedRows, error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      is_active: true
    })
    .eq('tenant_id', tenantId)
    .eq('id', userId)
    .select()

  if (updateError) {
    console.error('❌ Error updating user:', updateError.message)
    console.error('   Details:', updateError)
    return
  }

  if (!updatedRows || updatedRows.length === 0) {
    console.error('❌ No rows were updated!')
    return
  }

  console.log('✅ User approved successfully!')
  console.log('   Updated rows:', updatedRows.length)
  console.log('   Is Active (after):', updatedRows[0].is_active)
  console.log()

  // Step 3: Verify the change
  console.log('Step 3: Verifying the change...')
  const { data: afterUser, error: verifyError } = await supabaseAdmin
    .from('users')
    .select('id, email, is_active, role')
    .eq('id', userId)
    .single()

  if (verifyError) {
    console.error('❌ Error verifying user:', verifyError)
    return
  }

  console.log('✅ Verification complete:')
  console.log('   Email:', afterUser.email)
  console.log('   Is Active:', afterUser.is_active)
  console.log('   Role:', afterUser.role)
  console.log()

  if (afterUser.is_active) {
    console.log('🎉 SUCCESS! User approval works correctly with service_role key.')
    console.log('   The user can now log in to the application.')
  } else {
    console.log('⚠️ WARNING: User is still not active after update.')
  }
}

testApproveUser()
