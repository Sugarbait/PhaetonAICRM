import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cpkslvmydfdevdftieck.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3Nsdm15ZGZkZXZkZnRpZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDAyOTUsImV4cCI6MjA2MjQ3NjI5NX0.IfkIVsp3AtLOyXDW9hq9bEvnozd9IaaUay244iDhWGE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUpdateUser() {
  const userId = 'a5a5337a-4369-415c-9cb6-eb01b4034131'
  
  console.log(`\n🔧 Attempting to update user: ${userId}\n`)
  
  // Try to update with tenant_id filter
  console.log('Test 1: Update WITH tenant_id filter (current approach)...')
  const { data: data1, error: error1 } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('tenant_id', 'phaeton_ai')
    .eq('id', userId)
    .select()
  
  if (error1) {
    console.error('❌ Error:', error1.message || error1)
    console.error('   Details:', error1)
  } else {
    console.log('✅ Success! Updated rows:', data1?.length || 0)
    if (data1 && data1.length > 0) {
      console.log('   User is_active:', data1[0].is_active)
    } else {
      console.log('   ⚠️ No rows were updated!')
    }
  }
  
  console.log()
  
  // Try to update WITHOUT tenant_id filter
  console.log('Test 2: Update WITHOUT tenant_id filter...')
  const { data: data2, error: error2 } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('id', userId)
    .select()
  
  if (error2) {
    console.error('❌ Error:', error2.message || error2)
    console.error('   Details:', error2)
  } else {
    console.log('✅ Success! Updated rows:', data2?.length || 0)
    if (data2 && data2.length > 0) {
      console.log('   User is_active:', data2[0].is_active)
    } else {
      console.log('   ⚠️ No rows were updated!')
    }
  }
  
  console.log()
  
  // Check final state
  console.log('Final Check: Reading user state...')
  const { data: finalData, error: finalError } = await supabase
    .from('users')
    .select('id, email, tenant_id, is_active, role')
    .eq('id', userId)
    .single()
  
  if (finalError) {
    console.error('❌ Error reading user:', finalError.message || finalError)
  } else {
    console.log('✅ User current state:')
    console.log('   Email:', finalData.email)
    console.log('   Tenant ID:', finalData.tenant_id)
    console.log('   Is Active:', finalData.is_active)
    console.log('   Role:', finalData.role)
  }
}

testUpdateUser()
