/**
 * Check All Users in Database
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAllUsers() {
  try {
    console.log('🔍 Checking all users in database...\n')

    // Get all users (no tenant filter)
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('id, email, name, tenant_id, role, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }

    if (!allUsers || allUsers.length === 0) {
      console.log('⚠️  No users found in database')
      return
    }

    console.log(`Found ${allUsers.length} total users:\n`)

    // Group by tenant
    const byTenant = {}
    allUsers.forEach(user => {
      if (!byTenant[user.tenant_id]) {
        byTenant[user.tenant_id] = []
      }
      byTenant[user.tenant_id].push(user)
    })

    // Display by tenant
    Object.keys(byTenant).sort().forEach(tenant => {
      console.log(`\n📂 Tenant: ${tenant.toUpperCase()} (${byTenant[tenant].length} users)`)
      console.log('─'.repeat(80))

      byTenant[tenant].forEach(user => {
        console.log(`  Email: ${user.email}`)
        console.log(`  Name: ${user.name || 'N/A'}`)
        console.log(`  Role: ${user.role}`)
        console.log(`  Active: ${user.is_active}`)
        console.log(`  Created: ${new Date(user.created_at).toLocaleString()}`)
        console.log()
      })
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkAllUsers()
