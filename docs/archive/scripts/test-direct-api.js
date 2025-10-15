/**
 * Direct API test to pull recent data
 */

const RETELL_API_KEY = 'key_c3f084f5ca67781070e188b47d7f'

async function testAPI() {
  console.log('Testing Retell AI API...\n')

  // Test 1: List calls with no filters
  try {
    const callsResponse = await fetch('https://api.retellai.com/v2/list-calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sort_order: 'descending',
        limit: 5
      })
    })

    if (callsResponse.ok) {
      const callsData = await callsResponse.json()
      console.log('✅ Calls API Response:')
      console.log(`   Total calls found: ${callsData.calls?.length || 0}`)

      if (callsData.calls && callsData.calls.length > 0) {
        const call = callsData.calls[0]
        console.log(`\n   First Call Details:`)
        console.log(`   - Call ID: ${call.call_id}`)
        console.log(`   - Phone: ${call.from_number}`)
        console.log(`   - Duration: ${call.duration_ms}ms`)
        console.log(`   - Retell Cost (cents): ${call.call_cost?.combined_cost || 0}`)
        console.log(`   - Start: ${new Date(call.start_timestamp).toLocaleString()}`)
      }
    } else {
      console.log(`❌ Calls API failed: ${callsResponse.status}`)
    }
  } catch (error) {
    console.log(`❌ Calls API error: ${error.message}`)
  }

  // Test 2: List chats
  try {
    const chatsResponse = await fetch('https://api.retellai.com/list-chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sort_order: 'descending',
        limit: 5
      })
    })

    if (chatsResponse.ok) {
      const chatsData = await chatsResponse.json()
      console.log('\n✅ Chats API Response:')
      console.log(`   Total chats found: ${chatsData.chats?.length || 0}`)

      if (chatsData.chats && chatsData.chats.length > 0) {
        const chat = chatsData.chats[0]
        console.log(`\n   First Chat Details:`)
        console.log(`   - Chat ID: ${chat.chat_id}`)
        console.log(`   - Phone: ${chat.access_phone_number}`)
        console.log(`   - Messages: ${chat.message_with_tool_calls?.length || 0}`)
        console.log(`   - Retell Cost (cents): ${chat.chat_cost?.combined_cost || 0}`)
        console.log(`   - Start: ${new Date(chat.start_timestamp).toLocaleString()}`)
      }
    } else {
      const errorText = await chatsResponse.text()
      console.log(`❌ Chats API failed: ${chatsResponse.status} - ${errorText}`)
    }
  } catch (error) {
    console.log(`❌ Chats API error: ${error.message}`)
  }

  console.log('\n✅ API test complete!')
}

testAPI()
