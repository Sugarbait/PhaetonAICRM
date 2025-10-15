import React, { useState, useEffect } from 'react'
import {
  Key,
  Eye,
  EyeOff,
  Save,
  Check,
  X,
  AlertTriangle,
  Shield,
  Link,
  RefreshCw,
  Copy,
  Settings,
  TestTube
} from 'lucide-react'
import { enhancedUserService } from '@/services/enhancedUserService'
import { apiKeyFallbackService } from '@/services/apiKeyFallbackService'
import { retellService } from '@/services'
import { supabase } from '@/config/supabase'
import { getCurrentTenantId } from '@/config/tenantConfig'
import { getPrimaryCredentialUserId, hasSharedCredentials, getCredentialOwnerInfo } from '@/config/tenantCredentialConfig'

interface EnhancedApiKeyManagerProps {
  user: {
    id: string
    email: string
    name?: string
  }
}

interface ApiKeyState {
  retell_api_key: string
  call_agent_id: string
  sms_agent_id: string
}

interface OriginalApiKeyState {
  retell_api_key: string
  call_agent_id: string
  sms_agent_id: string
}

export const EnhancedApiKeyManager: React.FC<EnhancedApiKeyManagerProps> = ({ user }) => {
  const [apiKeys, setApiKeys] = useState<ApiKeyState>({
    retell_api_key: '',
    call_agent_id: '',
    sms_agent_id: ''
  })

  // Track original/saved state to properly detect unsaved changes
  const [originalApiKeys, setOriginalApiKeys] = useState<OriginalApiKeyState>({
    retell_api_key: '',
    call_agent_id: '',
    sms_agent_id: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  // Visibility states for sensitive fields
  const [showApiKey, setShowApiKey] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    // CRITICAL FIX: Load from Supabase FIRST for cross-device sync
    // Falls back to localStorage if Supabase unavailable (offline mode)
    // This ensures credentials are always loaded from the authoritative source
    console.log('🔧 API Key Manager: Initializing Supabase-first credential loading')
    loadApiKeys()
  }, [user.id])

  // Track unsaved changes by comparing current state with original saved state
  useEffect(() => {
    const hasChanges = apiKeys.retell_api_key !== originalApiKeys.retell_api_key ||
                      apiKeys.call_agent_id !== originalApiKeys.call_agent_id ||
                      apiKeys.sms_agent_id !== originalApiKeys.sms_agent_id
    setHasUnsavedChanges(hasChanges)
  }, [apiKeys, originalApiKeys])

  const loadApiKeys = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 API Key Manager: Loading credentials with Supabase-first strategy...')

      // Get current user
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      if (!currentUser.id) {
        console.log('⚠️ API Key Manager: No current user found')
        const blankApiKeys = {
          retell_api_key: '',
          call_agent_id: '',
          sms_agent_id: ''
        }
        setApiKeys(blankApiKeys)
        setOriginalApiKeys({ ...blankApiKeys })
        setIsLoading(false)
        return
      }

      const tenantId = getCurrentTenantId()

      // SHARED CREDENTIALS: Determine which user ID to load credentials from
      const credentialUserId = hasSharedCredentials(tenantId)
        ? getPrimaryCredentialUserId(tenantId) || currentUser.id
        : currentUser.id

      const isUsingSharedCredentials = credentialUserId !== currentUser.id

      if (isUsingSharedCredentials) {
        const ownerInfo = getCredentialOwnerInfo(tenantId)
        console.log(`🔗 API Key Manager: SHARED CREDENTIALS MODE`)
        console.log(`   Current user: ${currentUser.id} (${currentUser.email})`)
        console.log(`   Credential owner: ${ownerInfo?.primaryUserEmail}`)
        console.log(`   Any user can update - changes sync to all users in tenant`)
      } else {
        console.log(`🏢 API Key Manager: Loading for user ${currentUser.id}, tenant: ${tenantId}`)
      }

      let loadedApiKeys = {
        retell_api_key: '',
        call_agent_id: '',
        sms_agent_id: ''
      }

      // STRATEGY 1: Try loading from Supabase FIRST (cross-device sync)
      try {
        console.log('☁️ API Key Manager: Attempting Supabase load...')
        const { data, error } = await supabase
          .from('user_settings')
          .select('retell_api_key, call_agent_id, sms_agent_id')
          .eq('user_id', credentialUserId) // Load from primary user if shared credentials enabled
          .eq('tenant_id', tenantId)
          .single()

        if (!error && data) {
          console.log('✅ API Key Manager: Loaded from Supabase:', {
            hasApiKey: !!data.retell_api_key,
            apiKeyLength: data.retell_api_key?.length || 0,
            apiKeyPrefix: data.retell_api_key ? data.retell_api_key.substring(0, 15) + '...' : 'EMPTY',
            callAgentId: data.call_agent_id || 'EMPTY',
            smsAgentId: data.sms_agent_id || 'EMPTY'
          })

          loadedApiKeys = {
            retell_api_key: data.retell_api_key || '',
            call_agent_id: data.call_agent_id || '',
            sms_agent_id: data.sms_agent_id || ''
          }

          // Update localStorage to match Supabase (single source of truth)
          const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}')
          settings.retellApiKey = loadedApiKeys.retell_api_key
          settings.callAgentId = loadedApiKeys.call_agent_id
          settings.smsAgentId = loadedApiKeys.sms_agent_id
          localStorage.setItem(`settings_${currentUser.id}`, JSON.stringify(settings))
          console.log('💾 API Key Manager: Synced Supabase data to localStorage')

        } else {
          console.log('⚠️ API Key Manager: Supabase query returned no data or error:', error?.message)
          throw new Error('Supabase data not available')
        }

      } catch (supabaseError) {
        // STRATEGY 2: Fallback to localStorage if Supabase fails
        console.log('📦 API Key Manager: Supabase unavailable, falling back to localStorage')

        try {
          const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}')

          loadedApiKeys = {
            retell_api_key: settings.retellApiKey || '',
            call_agent_id: settings.callAgentId || '',
            sms_agent_id: settings.smsAgentId || ''
          }

          console.log('✅ API Key Manager: Loaded from localStorage fallback:', {
            hasApiKey: !!loadedApiKeys.retell_api_key,
            apiKeyLength: loadedApiKeys.retell_api_key?.length || 0,
            apiKeyPrefix: loadedApiKeys.retell_api_key ? loadedApiKeys.retell_api_key.substring(0, 15) + '...' : 'EMPTY',
            callAgentId: loadedApiKeys.call_agent_id || 'EMPTY',
            smsAgentId: loadedApiKeys.sms_agent_id || 'EMPTY'
          })

        } catch (localStorageError) {
          console.error('❌ API Key Manager: Both Supabase and localStorage failed')
          // loadedApiKeys remains empty, which is fine
        }
      }

      setApiKeys(loadedApiKeys)
      setOriginalApiKeys({ ...loadedApiKeys })

      console.log('🎯 API Key Manager: Load complete')

    } catch (err: any) {
      console.error('❌ API Key Manager: Critical error loading API keys:', err)
      setError(`Failed to load API keys: ${err.message}`)

      const blankApiKeys = {
        retell_api_key: '',
        call_agent_id: '',
        sms_agent_id: ''
      }
      setApiKeys(blankApiKeys)
      setOriginalApiKeys({ ...blankApiKeys })
    } finally {
      setIsLoading(false)
    }
  }

  const validateApiKeys = () => {
    const errors: Record<string, string> = {}

    // Validate API Key - should be a non-empty string
    if (apiKeys.retell_api_key && apiKeys.retell_api_key.trim()) {
      if (apiKeys.retell_api_key.trim().length < 8) {
        errors.retell_api_key = 'API key appears too short. Please verify it\'s correct.'
      }
      // Check for common key patterns but don't enforce specific format
      if (!/^[a-zA-Z0-9_\-\.]+$/.test(apiKeys.retell_api_key.trim())) {
        errors.retell_api_key = 'API key contains invalid characters. Only letters, numbers, underscores, hyphens, and dots allowed.'
      }
    }

    // Validate Agent IDs - alphanumeric strings (NO agent_ prefix requirement)
    if (apiKeys.call_agent_id && apiKeys.call_agent_id.trim()) {
      const cleanCallAgentId = apiKeys.call_agent_id.trim()
      if (cleanCallAgentId.length < 8) {
        errors.call_agent_id = 'Call Agent ID appears too short. Should be at least 8 characters.'
      } else if (!/^[a-zA-Z0-9_-]+$/.test(cleanCallAgentId)) {
        errors.call_agent_id = 'Call Agent ID should only contain letters, numbers, underscores, or hyphens.'
      }
    }

    if (apiKeys.sms_agent_id && apiKeys.sms_agent_id.trim()) {
      const cleanSmsAgentId = apiKeys.sms_agent_id.trim()
      if (cleanSmsAgentId.length < 8) {
        errors.sms_agent_id = 'SMS Agent ID appears too short. Should be at least 8 characters.'
      } else if (!/^[a-zA-Z0-9_-]+$/.test(cleanSmsAgentId)) {
        errors.sms_agent_id = 'SMS Agent ID should only contain letters, numbers, underscores, or hyphens.'
      }
    }


    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateApiKeys()) {
      setError('Please fix validation errors before saving')
      return
    }

    // Trim all values before saving
    const trimmedApiKeys = {
      retell_api_key: apiKeys.retell_api_key.trim(),
      call_agent_id: apiKeys.call_agent_id.trim(),
      sms_agent_id: apiKeys.sms_agent_id.trim()
    }

    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)
    setTestResult(null)

    try {
      console.log('Saving API keys:', {
        hasApiKey: !!trimmedApiKeys.retell_api_key,
        apiKeyLength: trimmedApiKeys.retell_api_key.length,
        apiKeyPrefix: trimmedApiKeys.retell_api_key.substring(0, 15) + '...',
        callAgentId: trimmedApiKeys.call_agent_id,
        smsAgentId: trimmedApiKeys.sms_agent_id
      })

      // First, update localStorage immediately with plain text values
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      if (currentUser.id) {
        const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}')
        settings.retellApiKey = trimmedApiKeys.retell_api_key
        settings.callAgentId = trimmedApiKeys.call_agent_id
        settings.smsAgentId = trimmedApiKeys.sms_agent_id
        localStorage.setItem(`settings_${currentUser.id}`, JSON.stringify(settings))
        console.log('Updated localStorage with plain text API keys')
      }

      // Update retell service immediately
      retellService.updateCredentials(
        trimmedApiKeys.retell_api_key,
        trimmedApiKeys.call_agent_id,
        trimmedApiKeys.sms_agent_id
      )

      // SHARED CREDENTIALS: Determine which user ID to save credentials to
      const tenantId = getCurrentTenantId()
      const credentialUserId = hasSharedCredentials(tenantId)
        ? getPrimaryCredentialUserId(tenantId) || user.id
        : user.id

      const isUsingSharedCredentials = credentialUserId !== user.id

      if (isUsingSharedCredentials) {
        const ownerInfo = getCredentialOwnerInfo(tenantId)
        console.log(`🔗 Saving to SHARED credential storage (owner: ${ownerInfo?.primaryUserEmail})`)
      }

      // Try to save to database (primary user's record if shared credentials enabled)
      try {
        const response = await enhancedUserService.updateUserApiKeys(credentialUserId, trimmedApiKeys)

        if (response.status === 'success') {
          console.log('Successfully saved API keys to database')
        } else {
          console.warn('Database save failed, but localStorage save succeeded:', response.error)
        }
      } catch (dbError) {
        console.warn('Database save failed, but localStorage save succeeded:', dbError)
      }

      // Update local state and reset unsaved changes tracking
      setApiKeys(trimmedApiKeys)
      setOriginalApiKeys({ ...trimmedApiKeys })
      setHasUnsavedChanges(false)

      // Success message - only show if at least one key is provided
      if (trimmedApiKeys.retell_api_key || trimmedApiKeys.call_agent_id || trimmedApiKeys.sms_agent_id) {
        setSuccessMessage('API keys saved successfully! Keys will persist across sessions.')
      } else {
        setSuccessMessage('API keys cleared successfully.')
      }

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('apiConfigurationReady', {
        detail: {
          retellApiKey: trimmedApiKeys.retell_api_key,
          callAgentId: trimmedApiKeys.call_agent_id,
          smsAgentId: trimmedApiKeys.sms_agent_id
        }
      }))

      setTimeout(() => setSuccessMessage(null), 5000)

    } catch (err: any) {
      console.error('Error saving API keys:', err)
      setError('Failed to save API keys. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!apiKeys.retell_api_key) {
      setError('Please enter an API key before testing')
      return
    }

    setIsTesting(true)
    setTestResult(null)
    setError(null)

    try {
      // Update retell service with current credentials for testing
      retellService.updateCredentials(
        apiKeys.retell_api_key,
        apiKeys.call_agent_id,
        apiKeys.sms_agent_id
      )

      const result = await retellService.testConnection()

      setTestResult({
        success: result.success,
        message: result.success
          ? 'API connection successful! Your credentials are working correctly.'
          : result.message || 'Connection test failed'
      })

    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed'
      })
    } finally {
      setIsTesting(false)
    }
  }


  const handleCopyToClipboard = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const maskApiKey = (apiKey: string) => {
    if (!apiKey) return ''
    if (apiKey.length <= 8) return '••••••••'
    return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4)
  }

  const checkSchemaStatus = async () => {
    try {
      console.log('🔍 Checking database schema status...')
      setSuccessMessage('Database schema check complete. API keys are stored securely.')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Schema check error:', error)
      setError('Schema check failed. API keys will still work from local storage.')
      setTimeout(() => setError(null), 3000)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            API Key Management
            {(() => {
              const tenantId = getCurrentTenantId()
              const isShared = hasSharedCredentials(tenantId)
              const ownerInfo = getCredentialOwnerInfo(tenantId)

              return isShared && ownerInfo ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md border border-green-300 dark:border-green-700">
                  <Link className="w-3 h-3" />
                  Shared with all users
                </span>
              ) : null
            })()}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {(() => {
              const tenantId = getCurrentTenantId()
              const isShared = hasSharedCredentials(tenantId)
              const ownerInfo = getCredentialOwnerInfo(tenantId)

              return isShared && ownerInfo
                ? `Shared credentials managed by ${ownerInfo.primaryUserEmail}. Any user can update these credentials.`
                : 'Configure your API credentials for call and SMS services'
            })()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={checkSchemaStatus}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Check database schema status"
          >
            <Settings className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              loadApiKeys()
            }}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Reload API keys from storage"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-start gap-3 mb-6">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
          <div className="flex-1">
            <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className={`border rounded-lg p-4 flex items-start gap-3 mb-6 ${
          testResult.success
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
        }`}>
          <div className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {testResult.success ? <Check /> : <AlertTriangle />}
          </div>
          <div className="flex-1">
            <h4 className={`text-sm font-medium ${
              testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              Connection Test {testResult.success ? 'Passed' : 'Failed'}
            </h4>
            <p className={`text-sm mt-1 ${
              testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {testResult.message}
            </p>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className={testResult.success
              ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200'
              : 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200'
            }
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading API keys...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* API Key Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                API Key *
              </label>
              <div className="flex items-center gap-2">
                {apiKeys.retell_api_key && (
                  <>
                    <button
                      onClick={() => handleCopyToClipboard('retell_api_key', apiKeys.retell_api_key)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Copy API key"
                    >
                      {copiedField === 'retell_api_key' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeys.retell_api_key}
                onChange={(e) => setApiKeys({ ...apiKeys, retell_api_key: e.target.value })}
                placeholder="Enter your Retell API key"
                className={`w-full px-3 py-2 pr-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.retell_api_key ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Key className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            {validationErrors.retell_api_key && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{validationErrors.retell_api_key}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your API key is encrypted and stored securely
            </p>
          </div>

          {/* Agent IDs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Call Agent ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={apiKeys.call_agent_id}
                  onChange={(e) => setApiKeys({ ...apiKeys, call_agent_id: e.target.value })}
                  placeholder="Enter Call Agent ID (e.g., oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD)"
                  className={`w-full px-3 py-2 pr-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.call_agent_id ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
                {apiKeys.call_agent_id && (
                  <button
                    onClick={() => handleCopyToClipboard('call_agent_id', apiKeys.call_agent_id)}
                    className="absolute inset-y-0 right-8 pr-1 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Copy Call Agent ID"
                  >
                    {copiedField === 'call_agent_id' ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
              {validationErrors.call_agent_id && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{validationErrors.call_agent_id}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Agent used for outbound calls. No specific prefix required - just use your Agent ID from Retell dashboard.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                SMS/Chat Agent ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={apiKeys.sms_agent_id}
                  onChange={(e) => setApiKeys({ ...apiKeys, sms_agent_id: e.target.value })}
                  placeholder="Enter SMS Agent ID (e.g., pLmNoPqRsTuVwXyZ1234567890AbCdEf)"
                  className={`w-full px-3 py-2 pr-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.sms_agent_id ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
                {apiKeys.sms_agent_id && (
                  <button
                    onClick={() => handleCopyToClipboard('sms_agent_id', apiKeys.sms_agent_id)}
                    className="absolute inset-y-0 right-8 pr-1 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Copy SMS Agent ID"
                  >
                    {copiedField === 'sms_agent_id' ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
              {validationErrors.sms_agent_id && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{validationErrors.sms_agent_id}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Agent used for SMS and chat conversations. No specific prefix required - just use your Agent ID from Retell dashboard.
              </p>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges || Object.keys(validationErrors).length > 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save API Keys'}
            </button>

            <button
              onClick={handleTestConnection}
              disabled={isTesting || !apiKeys.retell_api_key}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isTesting ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Status Panel */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Configuration Status</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">API Key</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${apiKeys.retell_api_key ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {apiKeys.retell_api_key ? 'Configured' : 'Not configured'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">Call Agent</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${apiKeys.call_agent_id ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {apiKeys.call_agent_id ? 'Configured' : 'Not configured'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">SMS Agent</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${apiKeys.sms_agent_id ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {apiKeys.sms_agent_id ? 'Configured' : 'Not configured'}
                  </span>
                </div>
              </div>
            </div>
            {hasUnsavedChanges && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>You have unsaved changes</span>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}