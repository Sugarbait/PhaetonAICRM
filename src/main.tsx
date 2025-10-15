console.log('🚀 Starting Phaeton AI CRM...')

import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Basic user setup - preserves existing data to prevent avatar loss
try {
  // Note: No default users - users will be created through Azure AD authentication
  const defaultSettings = {
    theme: 'light',
    mfaEnabled: false,
    refreshInterval: 30000,
    sessionTimeout: 15,
    notifications: { calls: true, sms: true, system: true },
    // Retell credentials will be loaded from retellCredentials.ts
    retellApiKey: '',
    callAgentId: '',
    smsAgentId: ''
  }

  // Phaeton AI: Users will be created through Azure AD authentication
  // No default users are created at startup
  const existingUser = localStorage.getItem('currentUser')
  if (existingUser) {
    try {
      const userData = JSON.parse(existingUser)
      console.log('✅ Existing user found:', userData.email || userData.id)
    } catch (parseError) {
      console.warn('Failed to parse existing user data:', parseError)
    }
  }

  // Phaeton AI: Settings and users are managed through Azure AD authentication
  // No automatic user or settings creation at startup

  console.log('✅ Basic user setup completed')
} catch (error) {
  console.error('❌ Basic setup failed:', error)
}

// Simple loading component with inline dark mode support
const LoadingApp: React.FC = () => {
  // Check theme from localStorage or system preference
  const isDark = React.useMemo(() => {
    try {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark') return true
      if (savedTheme === 'light') return false
      // Check system preference
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isDark ? '#111827' : '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: isDark ? '#2563eb' : '#3b82f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}>
          <span style={{ color: 'white', fontSize: '24px' }}>🏥</span>
        </div>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: isDark ? '#f3f4f6' : '#1f2937',
          marginBottom: '8px'
        }}>Phaeton AI CRM</h1>
        <p style={{
          color: isDark ? '#9ca3af' : '#4b5563'
        }}>Loading application...</p>
        <div style={{
          marginTop: '16px',
          fontSize: '14px',
          color: isDark ? '#6b7280' : '#6b7280'
        }}>
          Initializing HIPAA-compliant environment
        </div>
      </div>
    </div>
  )
}

// Main App Component that loads progressively
const MainApp: React.FC = () => {
  const [appLoaded, setAppLoaded] = React.useState(false)
  const [App, setApp] = React.useState<React.ComponentType | null>(null)

  React.useEffect(() => {
    console.log('📱 Loading main App component...')

    // Initialize critical authentication fixes immediately
    Promise.allSettled([
      import('./services/authFlowEnhancer').then(({ authFlowEnhancer }) => {
        authFlowEnhancer.initialize()
        console.log('🔧 Auth flow enhancer started early')
      }).catch(() => console.log('Early auth flow enhancer init failed')),
      import('./utils/azureAuthFix').then(() => {
        console.log('🔧 Azure auth fix started early')
      }).catch(() => console.log('Early Azure auth fix init failed')),
      import('./utils/localhostAuthFix').then(() => {
        console.log('🔧 Localhost auth fix started early')
      }).catch(() => console.log('Early localhost auth fix init failed'))
    ]).then(() => {
      console.log('✅ Critical auth fixes initialized')
    })

    // Load the App component dynamically
    import('./App.tsx')
      .then((module) => {
        console.log('✅ App component loaded successfully')
        setApp(() => module.default)
        setAppLoaded(true)
      })
      .catch((error) => {
        console.error('❌ Failed to load App component:', error)
        // Show error state
        setApp(() => () => {
          const isDark = (() => {
            try {
              const savedTheme = localStorage.getItem('theme')
              if (savedTheme === 'dark') return true
              if (savedTheme === 'light') return false
              return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            } catch {
              return false
            }
          })()

          return (
            <div style={{
              minHeight: '100vh',
              backgroundColor: isDark ? '#111827' : '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: isDark ? '#f87171' : '#991b1b',
                  marginBottom: '8px'
                }}>Loading Error</h1>
                <p style={{
                  color: isDark ? '#ef4444' : '#dc2626'
                }}>Failed to load application</p>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    marginTop: '16px',
                    padding: '8px 16px',
                    backgroundColor: isDark ? '#dc2626' : '#ef4444',
                    color: 'white',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDark ? '#b91c1c' : '#dc2626'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = isDark ? '#dc2626' : '#ef4444'}
                >
                  Retry
                </button>
              </div>
            </div>
          )
        })
        setAppLoaded(true)
      })
  }, [])

  if (!appLoaded || !App) {
    return <LoadingApp />
  }

  return <App />
}

// Background initialization - runs after app loads
setTimeout(() => {
  console.log('🔧 Starting background initialization...')

  Promise.allSettled([
    // import('./utils/clearCorruptedMfaData').catch(() => console.log('MFA cleanup skipped')), // DISABLED: Was clearing MFA data on every load
    import('./services/globalServiceInitializer').then(({ globalServiceInitializer }) =>
      globalServiceInitializer.initialize()
    ).catch(() => console.log('Global service init skipped')),
    // DISABLED: Bulletproof credential initializer prevents users from saving their own API keys
    // import('./services/bulletproofCredentialInitializer').then(({ bulletproofCredentialInitializer }) =>
    //   bulletproofCredentialInitializer.initialize()
    // ).catch(() => console.log('Bulletproof credentials skipped')),
    // Initialize authentication fixes for login loop issues
    import('./services/authFlowEnhancer').then(({ authFlowEnhancer }) =>
      authFlowEnhancer.initialize()
    ).catch(() => console.log('Auth flow enhancer init skipped')),
    import('./utils/azureAuthFix').then(() =>
      console.log('✅ Azure auth fix initialized')
    ).catch(() => console.log('Azure auth fix init skipped')),
    import('./utils/localhostAuthFix').then(() =>
      console.log('✅ Localhost auth fix initialized')
    ).catch(() => console.log('Localhost auth fix init skipped'))
  ]).then(() => {
    console.log('✅ Background initialization completed')
  })
}, 5000)

// Mount the application
console.log('🚀 Mounting React application...')

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <MainApp />
    </React.StrictMode>
  )
  console.log('✅ React application mounted successfully')
} else {
  console.error('❌ Root element not found!')
}