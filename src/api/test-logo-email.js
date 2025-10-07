/**
 * Logo Display Test Script for Email Server
 *
 * This script tests different logo display methods:
 * 1. Base64 inline (default - maximum compatibility)
 * 2. External URL (fallback for when base64 is not available)
 * 3. CID attachment (alternative method for some email clients)
 *
 * Usage: node test-logo-email.js <recipient-email> [method]
 * Methods: default, external, cid
 */

import fetch from 'node-fetch'

const EMAIL_SERVER_URL = 'http://localhost:4001'
const recipient = process.argv[2]
const method = process.argv[3] || 'default'

if (!recipient) {
  console.error('❌ Please provide a recipient email address')
  console.error('Usage: node test-logo-email.js <recipient-email> [method]')
  console.error('Methods: default (base64), external, cid')
  process.exit(1)
}

async function testLogoDisplay() {
  console.log('🧪 Testing logo display in email templates...')
  console.log(`📧 Recipient: ${recipient}`)
  console.log(`🎯 Method: ${method}`)

  try {
    // First check logo status
    console.log('\n📊 Checking logo status...')
    const statusResponse = await fetch(`${EMAIL_SERVER_URL}/api/logo-status`)
    const status = await statusResponse.json()

    console.log('Logo Status:', {
      logoAvailable: status.logoAvailable,
      logoFileExists: status.logoFileExists,
      logoSize: `${(status.logoSize / 1024).toFixed(2)} KB`,
      externalUrl: status.externalUrl
    })

    // Send test email
    console.log('\n📧 Sending test email...')
    const testResponse = await fetch(`${EMAIL_SERVER_URL}/api/test-logo-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient,
        method
      })
    })

    const result = await testResponse.json()

    if (result.success) {
      console.log('✅ Logo test email sent successfully!')
      console.log('📝 Details:', {
        messageId: result.messageId,
        method: result.method,
        logoMethod: result.logoMethod,
        timestamp: result.timestamp
      })
      console.log('\n📬 Please check your email and verify if the logo displays correctly.')
      console.log('\n💡 If the logo doesn\'t display:')
      console.log('   1. Check if your email client blocks images by default')
      console.log('   2. Look for "Show images" or "Load images" button')
      console.log('   3. Add carexps@phaetonai.com to your safe senders list')
      console.log('   4. Try different methods: node test-logo-email.js', recipient, '[external|cid]')
    } else {
      console.error('❌ Failed to send test email:', result.error)
      if (result.details) {
        console.error('   Details:', result.details)
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('   1. Make sure email server is running on port 4001')
    console.error('   2. Check if HOSTINGER_EMAIL_PASSWORD is set in .env.email')
    console.error('   3. Verify network connectivity')
  }
}

// Run the test
testLogoDisplay()