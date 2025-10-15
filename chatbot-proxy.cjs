/**
 * Simple OpenAI Proxy Server for Chatbot
 * Runs on port 3008 to proxy requests to OpenAI API
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const express = require('express')
const cors = require('cors')
const https = require('https')

const app = express()
const PORT = 3008

// Enable CORS for localhost
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Chatbot proxy server is running' })
})

// OpenAI proxy endpoint
app.post('/api/chatgpt', async (req, res) => {
  try {
    console.log('📨 Received chatbot request')

    const apiKey = process.env.VITE_OPENAI_API_KEY || req.body.apiKey

    if (!apiKey) {
      console.error('❌ No OpenAI API key provided')
      return res.status(400).json({
        success: false,
        error: 'OpenAI API key not configured'
      })
    }

    const { model, messages, max_tokens, temperature } = req.body

    console.log('🚀 Calling OpenAI API...', {
      model,
      messageCount: messages?.length,
      maxTokens: max_tokens
    })

    const requestBody = JSON.stringify({
      model: model || 'gpt-3.5-turbo',
      messages,
      max_tokens: max_tokens || 1000,
      temperature: temperature || 0.7
    })

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    }

    // Make HTTPS request to OpenAI
    const openaiRequest = https.request(options, (openaiResponse) => {
      let responseData = ''

      openaiResponse.on('data', (chunk) => {
        responseData += chunk
      })

      openaiResponse.on('end', () => {
        try {
          const data = JSON.parse(responseData)

          if (openaiResponse.statusCode !== 200) {
            console.error('❌ OpenAI API error:', openaiResponse.statusCode, responseData)
            return res.status(openaiResponse.statusCode).json({
              success: false,
              error: `OpenAI API error: ${openaiResponse.statusCode}`
            })
          }

          console.log('✅ OpenAI API response received')

          // Return in the format expected by simpleChatService
          if (data.choices && data.choices[0] && data.choices[0].message) {
            res.json({
              success: true,
              message: data.choices[0].message.content.trim()
            })
          } else {
            console.error('❌ Unexpected OpenAI response format:', data)
            res.status(500).json({
              success: false,
              error: 'Unexpected response format from OpenAI'
            })
          }
        } catch (parseError) {
          console.error('❌ Failed to parse OpenAI response:', parseError)
          res.status(500).json({
            success: false,
            error: 'Failed to parse OpenAI response'
          })
        }
      })
    })

    openaiRequest.on('error', (error) => {
      console.error('❌ OpenAI request error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    })

    openaiRequest.write(requestBody)
    openaiRequest.end()

  } catch (error) {
    console.error('❌ Proxy server error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  🤖 Chatbot Proxy Server                             ║
║  ✅ Running on http://localhost:${PORT}                 ║
║  📡 Ready to proxy OpenAI API requests               ║
╚═══════════════════════════════════════════════════════╝
  `)
})
