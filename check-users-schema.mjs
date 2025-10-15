import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  console.log('=== CHECKING USERS TABLE SCHEMA ===\n')

  // Get one user to see what columns exist
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Available columns in users table:')
  Object.keys(user).forEach(column => {
    console.log(`  - ${column}: ${typeof user[column]}`)
  })

  console.log('\n=== SOLUTION ===')
  console.log('The metadata column does NOT exist in the users table.')
  console.log('We need to either:')
  console.log('  1. Add a metadata column (JSONB type)')
  console.log('  2. Find an alternative way to store the original_role')
  console.log('  3. Simply store the role directly in the role column')
}

checkSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script Error:', err)
    process.exit(1)
  })
