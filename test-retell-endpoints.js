/**
 * Retell AI Endpoint Testing Script
 * Run this in browser console or Node.js to find the correct endpoint
 */

async function testRetellEndpoints() {
  const API_KEY = 'key_c3f084f5ca67781070e188b47d7f' // Your API key
  const BASE_URL = 'https://api.retellai.com'

  const endpoints = [
    '/v1/list-calls',    // Most likely correct
    '/list-calls',       // Without version
    '/v2/calls',         // Alternative naming
    '/v1/calls',         // v1 alternative
    '/v2/list-calls',    // Your current (should work but getting 404)
    '/calls',            // Simple version
  ]

  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }

  const testPayload = {
    limit: 1,
    sort_order: 'descending'
  }

  console.log('🔍 Testing Retell AI endpoints...\n')

  for (const endpoint of endpoints) {
    try {
      const url = `${BASE_URL}${endpoint}`
      console.log(`Testing: POST ${url}`)

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload)
      })

      console.log(`Status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ SUCCESS! Working endpoint: ${endpoint}`)
        console.log(`Response structure:`, Object.keys(data))
        console.log(`Data type:`, Array.isArray(data) ? 'Array' : typeof data)
        return { endpoint, data }
      } else {
        const errorText = await response.text()
        console.log(`❌ Failed: ${errorText.substring(0, 100)}...`)
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
    console.log('---')
  }

  console.log('\n🔍 If none worked, try GET method on these endpoints:')

  // Test GET method as fallback
  const getEndpoints = ['/v1/calls', '/calls', '/v1/list-calls', '/list-calls']

  for (const endpoint of getEndpoints) {
    try {
      const url = `${BASE_URL}${endpoint}?limit=1`
      console.log(`Testing: GET ${url}`)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      console.log(`Status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ SUCCESS with GET! Working endpoint: ${endpoint}`)
        console.log(`Response structure:`, Object.keys(data))
        return { endpoint, data, method: 'GET' }
      } else {
        const errorText = await response.text()
        console.log(`❌ Failed: ${errorText.substring(0, 100)}...`)
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
    console.log('---')
  }
}

// Run the test
testRetellEndpoints().then(result => {
  if (result) {
    console.log('\n🎉 Found working endpoint:', result)
  } else {
    console.log('\n❌ No working endpoints found. Check your API key or contact Retell AI support.')
  }
})