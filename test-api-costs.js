/**
 * Test script to verify Retell AI and Twilio API cost data
 * Shows the 5 most recent calls and chats with detailed cost breakdown
 */

const RETELL_API_KEY = 'key_c3f084f5ca67781070e188b47d7f'
const USD_TO_CAD_RATE = 1.45

// Twilio rates
const TWILIO_VOICE_RATE_USD = 0.022 // per minute
const TWILIO_SMS_RATE_USD = 0.0083 // per segment

async function fetchRetellCalls() {
  try {
    console.log('\n📞 Fetching Recent Calls from Retell AI...\n')

    const response = await fetch('https://api.retellai.com/v2/list-calls', {
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

    if (!response.ok) {
      throw new Error(`Retell API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const calls = data.calls || []
    console.log(`Found ${calls.length} calls\n`)

    // Get 5 most recent calls
    const recentCalls = calls.slice(0, 5)

    console.log('=' .repeat(80))
    console.log('RECENT CALLS - COST BREAKDOWN')
    console.log('=' .repeat(80))

    if (recentCalls.length === 0) {
      console.log('\nNo calls found.')
    }

    for (const call of recentCalls) {
      const callId = call.call_id
      const duration = call.duration_ms ? call.duration_ms / 1000 : 0
      const durationMinutes = Math.ceil(duration / 60)

      // Retell AI cost
      const retellCostCents = call.call_cost?.combined_cost || 0
      const retellCostUSD = retellCostCents / 100
      const retellCostCAD = retellCostUSD * USD_TO_CAD_RATE

      // Twilio Voice cost
      const twilioCostUSD = durationMinutes * TWILIO_VOICE_RATE_USD
      const twilioCostCAD = twilioCostUSD * USD_TO_CAD_RATE

      // Total
      const totalUSD = retellCostUSD + twilioCostUSD
      const totalCAD = retellCostCAD + twilioCostCAD

      console.log(`\nCall ID: ${callId.substring(0, 30)}...`)
      console.log(`Phone: ${call.from_number || 'N/A'}`)
      console.log(`Duration: ${Math.floor(duration)}s (${durationMinutes} billed minutes)`)
      console.log(`Start: ${new Date(call.start_timestamp).toLocaleString()}`)
      console.log(`-`.repeat(80))
      console.log(`  Retell AI Voice:  $${retellCostUSD.toFixed(4)} USD × 1.45 = $${retellCostCAD.toFixed(4)} CAD`)
      console.log(`  Twilio Voice:     $${twilioCostUSD.toFixed(4)} USD × 1.45 = $${twilioCostCAD.toFixed(4)} CAD`)
      console.log(`  ${'='.repeat(76)}`)
      console.log(`  TOTAL:            $${totalUSD.toFixed(4)} USD × 1.45 = $${totalCAD.toFixed(4)} CAD`)
    }

    console.log('\n' + '=' .repeat(80) + '\n')

  } catch (error) {
    console.error('Error fetching calls:', error.message)
  }
}

async function fetchRetellChats() {
  try {
    console.log('\n💬 Fetching Recent Chats from Retell AI...\n')

    const response = await fetch('https://api.retellai.com/list-chat', {
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

    if (!response.ok) {
      throw new Error(`Retell API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const chats = data.chats || []
    console.log(`Found ${chats.length} chats\n`)

    // Get 5 most recent chats
    const recentChats = chats.slice(0, 5)

    console.log('=' .repeat(80))
    console.log('RECENT SMS CHATS - COST BREAKDOWN')
    console.log('=' .repeat(80))

    if (recentChats.length === 0) {
      console.log('\nNo chats found.')
    }

    for (const chat of recentChats) {
      const chatId = chat.chat_id
      const messageCount = chat.message_with_tool_calls?.length || 0

      // Retell AI chat cost
      const retellChatCostCents = chat.chat_cost?.combined_cost || 0
      const retellChatCostUSD = retellChatCostCents / 100
      const retellChatCostWithFee = retellChatCostUSD > 0 ? retellChatCostUSD : 0.03
      const retellChatCostCAD = retellChatCostWithFee * USD_TO_CAD_RATE

      // Estimate SMS segments (rough calculation)
      let totalChars = 0
      if (chat.message_with_tool_calls) {
        chat.message_with_tool_calls.forEach(msg => {
          totalChars += (msg.content || '').length
        })
      }
      const estimatedSegments = Math.ceil(totalChars / 160) + 4 // +4 for initial prompt
      const twilioSMSCostUSD = estimatedSegments * TWILIO_SMS_RATE_USD
      const twilioSMSCostCAD = twilioSMSCostUSD * USD_TO_CAD_RATE

      // Total
      const totalUSD = retellChatCostWithFee + twilioSMSCostUSD
      const totalCAD = retellChatCostCAD + twilioSMSCostCAD

      const feeNote = retellChatCostUSD === 0 ? ' (added $0.03 fee)' : ''

      console.log(`\nChat ID: ${chatId.substring(0, 30)}...`)
      console.log(`Phone: ${chat.access_phone_number || 'N/A'}`)
      console.log(`Messages: ${messageCount}`)
      console.log(`Estimated Segments: ${estimatedSegments}`)
      console.log(`Start: ${new Date(chat.start_timestamp).toLocaleString()}`)
      console.log(`-`.repeat(80))
      console.log(`  Retell AI Chat:   $${retellChatCostWithFee.toFixed(4)} USD × 1.45 = $${retellChatCostCAD.toFixed(4)} CAD${feeNote}`)
      console.log(`  Twilio SMS:       $${twilioSMSCostUSD.toFixed(4)} USD × 1.45 = $${twilioSMSCostCAD.toFixed(4)} CAD`)
      console.log(`  ${'='.repeat(76)}`)
      console.log(`  TOTAL:            $${totalUSD.toFixed(4)} USD × 1.45 = $${totalCAD.toFixed(4)} CAD`)
    }

    console.log('\n' + '=' .repeat(80) + '\n')

  } catch (error) {
    console.error('Error fetching chats:', error.message)
  }
}

async function main() {
  console.log('\n🔍 VERIFYING API COST DATA WITH $1.45 CAD CONVERSION\n')
  console.log('Currency Rate: 1 USD = 1.45 CAD (FIXED)')
  console.log('Twilio Voice: $0.022 USD/min')
  console.log('Twilio SMS: $0.0083 USD/segment')
  console.log('')

  await fetchRetellCalls()
  await fetchRetellChats()

  console.log('✅ API verification complete!')
}

main()
