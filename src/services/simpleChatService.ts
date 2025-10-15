/**
 * 🔒 LOCKED CODE: SIMPLE CHAT SERVICE - PRODUCTION READY - NO MODIFICATIONS
 *
 * CRITICAL WARNING - PRODUCTION READY CODE
 * ABSOLUTELY NO MODIFICATIONS ALLOWED TO THIS SERVICE
 *
 * Simple Chat Service - Direct OpenAI Integration
 * A clean, straightforward implementation for ChatGPT integration
 *
 * This service is now working perfectly and is locked for production use.
 * Any modifications could result in:
 * - Breaking the OpenAI API authentication
 * - Environment detection issues (dev vs prod)
 * - Response format parsing errors
 * - Security vulnerabilities
 *
 * Last Verified Working: 2025-09-22
 * Status: Production Ready - LOCKED ✅
 * Development API: Direct OpenAI - Working ✅
 * Production API: Azure Function Proxy - Working ✅
 * Environment Detection: Working ✅
 * Response Formatting: Working ✅
 *
 * 🔒 END LOCKED CODE: SIMPLE CHAT SERVICE - PRODUCTION READY
 */

export interface SimpleChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface SimpleChatResponse {
  success: boolean
  message?: string
  error?: string
}

class SimpleChatService {
  private readonly apiUrl: string

  constructor() {
    // Use local proxy in development, Azure Function in production
    const isDevelopment = import.meta.env.DEV

    if (isDevelopment) {
      // Use local proxy server to avoid CORS issues
      this.apiUrl = 'http://localhost:3008/api/chatgpt'
    } else {
      // Production uses Azure Function proxy
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
      this.apiUrl = `${baseUrl}/api/chatgpt`
    }

    console.log('SimpleChatService initialized:', { isDevelopment, apiUrl: this.apiUrl })
  }

  async sendMessage(userMessage: string): Promise<SimpleChatResponse> {
    try {
      console.log('📤 SimpleChatService: Sending message:', userMessage)
      console.log('🔧 Environment:', { isDev: import.meta.env.DEV, apiUrl: this.apiUrl })

      const messages: SimpleChatMessage[] = [
        {
          role: 'system',
          content: `You are a helpful assistant for the Phaeton AI CRM platform - a comprehensive business communication management system.

PHAETON AI PLATFORM OVERVIEW:
Phaeton AI is a multi-tenant business CRM with AI-powered voice calling, SMS management, and comprehensive analytics. The platform integrates with Retell AI for voice calls and provides real-time communication tracking.

KEY FEATURES:

1. AI-Powered Voice Calling (Calls Page):
   - View call history with recordings and transcripts
   - Add detailed notes to calls
   - Retell AI integration for intelligent call handling
   - Filter calls by date range or outcome
   - Call analytics: duration, costs, success rates
   - Peak hour analysis for call volume
   - Cost tracking in Canadian dollars (CAD)

2. SMS Management (SMS Page):
   - View and manage SMS conversations
   - Twilio integration for messaging
   - Real-time SMS segment calculation
   - Cost optimization and tracking
   - Add notes to conversations
   - Filter chats by date, sentiment, or status
   - Message thread analysis
   - PDF export with detailed conversation analysis

3. Dashboard & Analytics:
   - Interactive charts showing call and SMS volumes
   - Cost distribution analysis
   - Performance trends with date range selection
   - Peak hour visualizations
   - Business hour weighting in analytics
   - Success rate tracking
   - Combined cost breakdown (calls + SMS)

4. Multi-Factor Authentication (MFA):
   - TOTP-based two-factor authentication
   - QR code setup with authenticator apps
   - Backup codes for account recovery
   - MFA enforcement for enhanced security
   - Protected pages require MFA verification

5. User Management (Super Users only):
   - User role assignment (Super User / Regular User)
   - Account activation and approval workflows
   - First user auto-promoted to Super User
   - User settings and profile management
   - Failed login attempt tracking
   - Account lockout protection (3 failed attempts)

6. Settings & Configuration:
   - Profile management (name, department, phone, bio)
   - API key configuration for Retell AI
   - SMS Agent ID setup
   - Theme selection (light/dark mode)
   - Email notification preferences
   - Cross-device settings synchronization

7. Security Features:
   - HIPAA-compliant audit logging
   - AES-256-GCM encryption for sensitive data
   - Tenant isolation (multi-tenant architecture)
   - Row Level Security (RLS) policies
   - Session management with configurable timeouts
   - Emergency logout (Ctrl+Shift+L)

8. Date Range Filtering:
   - Today, This Week, Last Week, This Month, This Year
   - Custom date range selection
   - Timezone-aware date handling
   - Applies across all pages (Dashboard, Calls, SMS)

9. Cost Tracking:
   - All costs displayed in CAD (Canadian dollars)
   - Twilio SMS costs: Based on message segments
   - Retell AI call costs: Combined with voice call fees
   - Real-time cost calculation
   - Cost breakdown by service type

10. Cross-Device Synchronization:
   - Real-time Supabase synchronization
   - Notes sync across devices
   - Settings persistence
   - API credentials cloud storage
   - Automatic conflict resolution

TENANT ISOLATION:
This is Phaeton AI CRM with tenant_id 'phaeton_ai'. The system shares a database with other tenants (ARTLEE, MedEx, CareXPS) but maintains complete data separation through tenant filtering.

NAVIGATION:
- Dashboard: Main overview with analytics and metrics
- Calls: Voice call management and recordings
- SMS: Message conversations and chat analytics
- Calendar: Activity calendar view
- Settings: Configuration and profile management
- User Management: Admin-only user controls (Super Users)

RESPONSE GUIDELINES:
- Use natural language with proper sentence structure
- Provide numbered lists for step-by-step instructions
- DO NOT use markdown formatting (no **, ##, bullets)
- Write in a professional, conversational tone
- Focus on actionable advice and clear explanations
- Reference specific page locations when helpful

SECURITY RESTRICTIONS:
- No access to patient data or PHI (Protected Health Information)
- Cannot discuss specific user records or business data
- Only provide platform navigation and feature guidance
- All analytics are aggregated and anonymized

Help users navigate the platform, understand features, and accomplish their tasks efficiently.`
        },
        {
          role: 'user',
          content: userMessage
        }
      ]

      // Send request to proxy server (both dev and production use the same format)
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7
        })
      })

      console.log('📡 API Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('📦 API Response data:', data)

      // Both development proxy and production Azure Function return standardized format
      if (data.success && data.message) {
        console.log('✅ Success: Response received from', import.meta.env.DEV ? 'proxy server' : 'Azure Function')
        return {
          success: true,
          message: data.message
        }
      }

      console.error('❌ Unexpected response format:', data)
      throw new Error('No response generated')

    } catch (error: any) {
      console.error('❌ Chat service error:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      return {
        success: false,
        error: `Unable to connect to chat service: ${error.message}`
      }
    }
  }
}

export const simpleChatService = new SimpleChatService()