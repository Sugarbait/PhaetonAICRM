/**
 * Migrate Logos to Supabase Cloud Storage
 * This script helps upload logos from localStorage to Supabase for cross-device sync
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

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

async function migrateLogosToCloud() {
  console.log('🔄 Migrating Logos to Supabase Cloud Storage...\n')

  try {
    // Check if company-logos bucket exists
    console.log('1️⃣ Checking for company-logos storage bucket...')
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === 'company-logos')

    if (!bucketExists) {
      console.log('   📦 Creating company-logos bucket...')
      const { error: createError } = await supabaseAdmin.storage.createBucket('company-logos', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (createError) {
        console.error('   ❌ Failed to create bucket:', createError.message)
        return
      }

      console.log('   ✅ Bucket created successfully')
    } else {
      console.log('   ✅ Bucket already exists')
    }

    console.log('')

    // Guide user on how to upload logos
    console.log('2️⃣ How to upload your logos:\n')
    console.log('   📋 OPTION 1: Via Web UI (Recommended)')
    console.log('   ================================')
    console.log('   1. Login to your CRM as a Super User')
    console.log('   2. Navigate to Settings > Branding')
    console.log('   3. Upload your company logo files:')
    console.log('      - Header Logo (displayed in sidebar)')
    console.log('      - Footer Logo Light (for dark backgrounds)')
    console.log('      - Footer Logo Dark (for light backgrounds)')
    console.log('      - Favicon (browser tab icon)')
    console.log('   4. Click Save')
    console.log('   5. Logos will automatically sync to all devices!')
    console.log('')

    console.log('   📋 OPTION 2: Place Files in public/images/')
    console.log('   ==========================================')
    console.log('   1. Place your logo files in: public/images/')
    console.log('      - artlee-logo.png (header logo)')
    console.log('      - artlee-favicon.png (favicon)')
    console.log('   2. The system will use these as defaults')
    console.log('   3. Then upload via Settings > Branding for cross-device sync')
    console.log('')

    // Check if default logo files exist
    console.log('3️⃣ Checking for default logo files...')
    const publicImagesPath = path.join(process.cwd(), 'public', 'images')
    const files = ['artlee-logo.png', 'artlee-favicon.png']

    for (const file of files) {
      const filePath = path.join(publicImagesPath, file)
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ Found: ${file}`)
      } else {
        console.log(`   ⚠️  Missing: ${file}`)
      }
    }

    console.log('')
    console.log('=' .repeat(80))
    console.log('✅ SETUP COMPLETE')
    console.log('=' .repeat(80))
    console.log('')
    console.log('📝 Next Steps:')
    console.log('   1. Login to your CRM as a Super User')
    console.log('   2. Go to Settings > Branding')
    console.log('   3. Upload your logo files')
    console.log('   4. Logos will sync automatically to:')
    console.log('      - All your devices')
    console.log('      - All browsers')
    console.log('      - Mobile and desktop')
    console.log('')
    console.log('💡 The logos will be stored in Supabase and accessible from any device!')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

migrateLogosToCloud()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err)
    process.exit(1)
  })
