/**
 * Check Logo Synchronization Status
 * Verifies logos are properly synced to Supabase cloud storage
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkLogoSync() {
  console.log('🔍 Checking Logo Synchronization Status...\n')

  try {
    // 1. Check company_settings table exists
    console.log('1️⃣ Checking company_settings table...')
    const { data: tables, error: tableError } = await supabaseAdmin
      .from('company_settings')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('   ❌ Table does not exist or error:', tableError.message)
      console.log('   💡 Need to create company_settings table')
      return
    }

    console.log('   ✅ Table exists')
    console.log('')

    // 2. Check for phaeton_ai logos
    console.log('2️⃣ Checking for phaeton_ai logos...')
    const { data: logoData, error: logoError } = await supabaseAdmin
      .from('company_settings')
      .select('*')
      .eq('tenant_id', 'phaeton_ai')
      .eq('name', 'company_logos')
      .maybeSingle()

    if (logoError) {
      console.error('   ❌ Error:', logoError.message)
      return
    }

    if (!logoData) {
      console.log('   ⚠️  No logos found in Supabase for phaeton_ai tenant')
      console.log('   💡 Logos need to be uploaded via Settings page')
      console.log('')
      return
    }

    console.log('   ✅ Logos found in Supabase!')
    console.log('   📦 Data:', JSON.stringify(logoData, null, 2))
    console.log('')

    // 3. Check logo storage bucket
    console.log('3️⃣ Checking logo storage bucket...')
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()

    if (bucketError) {
      console.error('   ❌ Error:', bucketError.message)
      return
    }

    const logosBucket = buckets.find(b => b.name === 'company-logos')
    if (!logosBucket) {
      console.log('   ⚠️  company-logos bucket does not exist')
      console.log('   💡 Bucket will be created automatically when first logo is uploaded')
    } else {
      console.log('   ✅ company-logos bucket exists')
      console.log('   📦 Bucket:', JSON.stringify(logosBucket, null, 2))

      // List files in bucket
      const { data: files, error: filesError } = await supabaseAdmin.storage
        .from('company-logos')
        .list()

      if (filesError) {
        console.error('   ❌ Error listing files:', filesError.message)
      } else if (files && files.length > 0) {
        console.log(`   📁 Files in bucket: ${files.length}`)
        files.forEach(file => {
          console.log(`      - ${file.name} (${(file.metadata?.size || 0 / 1024).toFixed(2)} KB)`)
        })
      } else {
        console.log('   📁 Bucket is empty')
      }
    }

    console.log('')
    console.log('=' .repeat(80))
    console.log('📊 SUMMARY')
    console.log('=' .repeat(80))

    if (logoData?.data) {
      const logos = logoData.data
      console.log('✅ Logo sync is working!')
      console.log('')
      console.log('Current logos:')
      console.log(`   Header Logo: ${logos.headerLogo ? 'SET' : 'NOT SET'}`)
      console.log(`   Footer Logo (Light): ${logos.footerLogoLight ? 'SET' : 'NOT SET'}`)
      console.log(`   Footer Logo (Dark): ${logos.footerLogoDark ? 'SET' : 'NOT SET'}`)
      console.log(`   Favicon: ${logos.favicon ? 'SET' : 'NOT SET'}`)
      console.log('')
      console.log('💡 Logos should be visible on any device')
    } else {
      console.log('⚠️  Logos not yet uploaded to Supabase')
      console.log('')
      console.log('💡 To enable cross-device sync:')
      console.log('   1. Login as a Super User')
      console.log('   2. Go to Settings > Branding')
      console.log('   3. Upload your logos')
      console.log('   4. Logos will automatically sync to all devices')
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

checkLogoSync()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
  })
