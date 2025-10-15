/**
 * Create the company-logos storage bucket in Supabase
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createLogoBucket() {
  try {
    console.log('🔍 Checking if company-logos bucket exists...\n')

    // Check if bucket already exists
    const { data: buckets } = await adminClient.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === 'company-logos')

    if (bucketExists) {
      console.log('✅ Bucket "company-logos" already exists!')
      console.log('\n📦 Bucket details:')
      const bucket = buckets.find(b => b.name === 'company-logos')
      console.log('   - Name:', bucket.name)
      console.log('   - Public:', bucket.public)
      console.log('   - Created:', bucket.created_at)
      return
    }

    console.log('⚠️  Bucket "company-logos" does not exist. Creating...\n')

    // Create the bucket
    const { data, error } = await adminClient.storage.createBucket('company-logos', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/jpg'],
      fileSizeLimit: 5242880 // 5MB
    })

    if (error) {
      console.error('❌ Failed to create bucket:', error.message)
      console.log('\n💡 Manual Steps:')
      console.log('   1. Go to your Supabase dashboard: https://supabase.com/dashboard')
      console.log('   2. Navigate to Storage')
      console.log('   3. Click "New bucket"')
      console.log('   4. Name: company-logos')
      console.log('   5. Enable "Public bucket"')
      console.log('   6. Set max file size: 5MB')
      console.log('   7. Allowed MIME types: image/png, image/jpeg, image/svg+xml, image/x-icon')
      process.exit(1)
    }

    console.log('✅ Bucket created successfully!')
    console.log('\n📦 Bucket details:')
    console.log('   - Name: company-logos')
    console.log('   - Public: true')
    console.log('   - Max file size: 5MB')
    console.log('   - Allowed types: PNG, JPEG, SVG, ICO')
    console.log('\n🎯 You can now upload company logos!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

createLogoBucket()
