/**
 * Test Email Notification System
 * Tests that email notifications are sent correctly for new SMS entries
 */

import axios from 'axios'

const testEmailNotification = async () => {
  console.log('🧪 Testing email notification system...')

  try {
    // Test the email notification endpoint
    const response = await axios.post('http://localhost:4001/api/send-sms-notification', {
      count: 1
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.status === 200) {
      console.log('✅ Email notification sent successfully!')
      console.log('📧 Response:', response.data)
    } else {
      console.error('❌ Email notification failed with status:', response.status)
    }
  } catch (error) {
    console.error('❌ Email notification test failed:', error.message)
    if (error.response) {
      console.error('Response data:', error.response.data)
    }
  }
}

testEmailNotification()