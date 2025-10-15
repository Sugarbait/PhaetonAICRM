/**
 * Credential Loader Service - Unified API credential loading system
 *
 * Consolidates duplicate credential loading logic from App.tsx and retellService.ts
 * Provides centralized, tenant-aware credential management with multiple fallback strategies
 *
 * SHARED CREDENTIALS: All users in a tenant load credentials from the primary user's settings.
 * This enables automatic synchronization - any user can update credentials and all users see the changes.
 *
 * Created: 2025-10-12 (Phase 2 cleanup - code consolidation)
 * Updated: 2025-10-12 (Added tenant-level shared credential support)
 */

import { supabase } from '../config/supabase'
import { getCurrentTenantId } from '../config/tenantConfig'
import { getPrimaryCredentialUserId, hasSharedCredentials } from '../config/tenantCredentialConfig'

export interface CredentialLoadResult {
  apiKey: string
  callAgentId: string
  smsAgentId: string
  source: 'supabase' | 'localStorage' | 'sessionStorage' | 'memory' | 'cloud' | 'none'
  success: boolean
}

export class CredentialLoaderService {
  /**
   * Load API credentials with Supabase-first strategy and comprehensive fallbacks
   *
   * @param userId - User ID to load credentials for
   * @param maxRetries - Maximum number of Supabase retry attempts (default: 3)
   * @param retryDelay - Delay between retries in milliseconds (default: 500)
   * @returns CredentialLoadResult with loaded credentials and source
   */
  public static async loadCredentialsWithRetry(
    userId: string,
    maxRetries: number = 3,
    retryDelay: number = 500
  ): Promise<CredentialLoadResult> {
    const tenantId = getCurrentTenantId()

    // SHARED CREDENTIALS: Determine which user ID to load credentials from
    // If shared credentials are enabled, load from primary user (e.g., Pierre for phaeton_ai)
    // Otherwise, load from the current user
    const credentialUserId = hasSharedCredentials(tenantId)
      ? getPrimaryCredentialUserId(tenantId) || userId
      : userId

    const isUsingSharedCredentials = credentialUserId !== userId

    if (isUsingSharedCredentials) {
      console.log(`🔗 CredentialLoaderService: SHARED CREDENTIALS MODE - Loading from primary user`)
      console.log(`   Current user: ${userId}`)
      console.log(`   Credential owner: ${credentialUserId}`)
      console.log(`   Tenant: ${tenantId}`)
    } else {
      console.log(`🏢 CredentialLoaderService: Loading credentials for user ${userId}, tenant: ${tenantId}`)
    }

    let credentialsLoaded = false
    let result: CredentialLoadResult = {
      apiKey: '',
      callAgentId: '',
      smsAgentId: '',
      source: 'none',
      success: false
    }

    // STRATEGY 1: Try loading from Supabase FIRST (cross-device sync) with retry logic
    try {
      let retryCount = 0

      while (retryCount < maxRetries && !credentialsLoaded) {
        try {
          if (retryCount > 0) {
            console.log(`🔄 CredentialLoaderService: Retry attempt ${retryCount}/${maxRetries} after ${retryDelay}ms delay...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay))
          }

          console.log(`☁️ CredentialLoaderService: Attempting Supabase credential load (attempt ${retryCount + 1}/${maxRetries})...`)
          const { data, error } = await supabase
            .from('user_settings')
            .select('retell_api_key, call_agent_id, sms_agent_id')
            .eq('user_id', credentialUserId) // Load from primary user if shared credentials enabled
            .eq('tenant_id', tenantId)
            .single()

          // Enhanced error logging for diagnosis
          if (error || !data || !data.retell_api_key) {
            console.log(`❌ CredentialLoaderService: Supabase query failed (attempt ${retryCount + 1}):`, {
              hasError: !!error,
              errorMessage: error?.message || 'No error object',
              errorCode: error?.code || 'No code',
              errorDetails: error?.details || 'No details',
              hasData: !!data,
              dataKeys: data ? Object.keys(data) : [],
              hasApiKey: !!data?.retell_api_key,
              userId: userId,
              tenantId: tenantId,
              retryAttempt: retryCount + 1
            })

            // If this is not the last retry, continue to next iteration
            if (retryCount < maxRetries - 1) {
              retryCount++
              continue // Try again
            } else {
              // Last retry failed, throw error to trigger fallback
              throw new Error('Supabase credentials not available after all retries')
            }
          }

          // Success case
          console.log(`✅ CredentialLoaderService: Loaded credentials from Supabase (attempt ${retryCount + 1}):`, {
            hasApiKey: !!data.retell_api_key,
            apiKeyLength: data.retell_api_key?.length || 0,
            apiKeyPrefix: data.retell_api_key ? data.retell_api_key.substring(0, 15) + '...' : 'EMPTY',
            callAgentId: data.call_agent_id || 'EMPTY',
            smsAgentId: data.sms_agent_id || 'EMPTY',
            sharedMode: isUsingSharedCredentials,
            credentialOwner: credentialUserId
          })

          // Update localStorage to match Supabase (single source of truth)
          // Store in CURRENT user's localStorage for quick access
          const settings = JSON.parse(localStorage.getItem(`settings_${userId}`) || '{}')
          settings.retellApiKey = data.retell_api_key || ''
          settings.callAgentId = data.call_agent_id || ''
          settings.smsAgentId = data.sms_agent_id || ''
          localStorage.setItem(`settings_${userId}`, JSON.stringify(settings))

          if (isUsingSharedCredentials) {
            console.log('💾 CredentialLoaderService: Synced SHARED credentials to current user localStorage')
          } else {
            console.log('💾 CredentialLoaderService: Synced Supabase credentials to localStorage')
          }

          result = {
            apiKey: data.retell_api_key || '',
            callAgentId: data.call_agent_id || '',
            smsAgentId: data.sms_agent_id || '',
            source: 'supabase',
            success: true
          }
          credentialsLoaded = true
          break // Success - exit retry loop

        } catch (attemptError) {
          console.log(`⚠️ CredentialLoaderService: Attempt ${retryCount + 1} exception:`, attemptError)
          retryCount++

          // If this was the last retry, let it fall through to the outer catch
          if (retryCount >= maxRetries) {
            throw attemptError
          }
        }
      }

    } catch (supabaseError) {
      // STRATEGY 2: Fallback to localStorage if Supabase fails
      console.log('📦 CredentialLoaderService: Supabase unavailable, falling back to localStorage')

      try {
        const settings = JSON.parse(localStorage.getItem(`settings_${userId}`) || '{}')

        if (settings.retellApiKey) {
          console.log('✅ CredentialLoaderService: Loaded credentials from localStorage fallback:', {
            hasApiKey: !!settings.retellApiKey,
            apiKeyLength: settings.retellApiKey?.length || 0,
            apiKeyPrefix: settings.retellApiKey ? settings.retellApiKey.substring(0, 15) + '...' : 'EMPTY',
            callAgentId: settings.callAgentId || 'EMPTY',
            smsAgentId: settings.smsAgentId || 'EMPTY'
          })

          result = {
            apiKey: settings.retellApiKey || '',
            callAgentId: settings.callAgentId || '',
            smsAgentId: settings.smsAgentId || '',
            source: 'localStorage',
            success: true
          }
          credentialsLoaded = true

        } else {
          console.log('⚠️ CredentialLoaderService: No credentials found in localStorage either')
        }

      } catch (localStorageError) {
        console.error('❌ CredentialLoaderService: Both Supabase and localStorage credential loading failed')
      }
    }

    // Return result whether successful or not
    return result
  }

  /**
   * Load credentials from localStorage for specific user (with tenant validation)
   *
   * @param userId - User ID to load credentials for
   * @returns Partial credential data or empty strings
   */
  public static async loadFromLocalStorage(userId: string): Promise<{apiKey: string, callAgentId: string, smsAgentId: string}> {
    try {
      const currentTenantId = getCurrentTenantId()
      const settings = JSON.parse(localStorage.getItem(`settings_${userId}`) || '{}')

      // Check if retellApiKey property exists (even if blank)
      if ('retellApiKey' in settings) {
        // CRITICAL: Verify credentials belong to current tenant
        const storedTenantId = settings.tenant_id

        if (!storedTenantId || storedTenantId === currentTenantId) {
          console.log('🎯 CredentialLoaderService - Found credentials in localStorage (tenant validated:', storedTenantId || 'unknown', ')')
          return {
            apiKey: settings.retellApiKey || '',
            callAgentId: settings.callAgentId || '',
            smsAgentId: settings.smsAgentId || ''
          }
        } else {
          console.warn(`⚠️ CredentialLoaderService - localStorage credentials belong to different tenant (${storedTenantId}) - skipping`)
          console.log(`   Current tenant: ${currentTenantId}, Stored tenant: ${storedTenantId}`)
        }
      }
    } catch (error) {
      console.warn('CredentialLoaderService - Error loading from localStorage:', error)
    }
    return {apiKey: '', callAgentId: '', smsAgentId: ''}
  }

  /**
   * Load credentials from sessionStorage backup (with tenant validation)
   *
   * @returns Partial credential data or empty strings
   */
  public static async loadFromSessionStorage(): Promise<{apiKey: string, callAgentId: string, smsAgentId: string}> {
    try {
      const sessionData = sessionStorage.getItem('retell_credentials_backup')
      if (sessionData) {
        const backup = JSON.parse(sessionData)
        if (backup.apiKey) {
          // Validate tenant_id if present
          if (backup.tenant_id) {
            const currentTenantId = getCurrentTenantId()

            if (backup.tenant_id !== currentTenantId) {
              console.warn(`⚠️ CredentialLoaderService - sessionStorage credentials belong to different tenant (${backup.tenant_id}), clearing...`)
              sessionStorage.removeItem('retell_credentials_backup')
              return {apiKey: '', callAgentId: '', smsAgentId: ''}
            }
          }

          console.log('🎯 CredentialLoaderService - Found credentials in sessionStorage backup (tenant validated)')
          return {
            apiKey: backup.apiKey,
            callAgentId: backup.callAgentId || '',
            smsAgentId: backup.smsAgentId || ''
          }
        }
      }
    } catch (error) {
      console.warn('CredentialLoaderService - Error loading from sessionStorage:', error)
    }
    return {apiKey: '', callAgentId: '', smsAgentId: ''}
  }

  /**
   * Load credentials from in-memory backup (with tenant validation)
   *
   * @returns Partial credential data or empty strings
   */
  public static async loadFromMemoryBackup(): Promise<{apiKey: string, callAgentId: string, smsAgentId: string}> {
    try {
      const backup = (window as any).__retellCredentialsBackup
      if (backup && backup.apiKey) {
        // Validate tenant_id if present
        if (backup.tenant_id) {
          const currentTenantId = getCurrentTenantId()

          if (backup.tenant_id !== currentTenantId) {
            console.warn(`⚠️ CredentialLoaderService - memory backup credentials belong to different tenant (${backup.tenant_id}), clearing...`)
            delete (window as any).__retellCredentialsBackup
            return {apiKey: '', callAgentId: '', smsAgentId: ''}
          }
        }

        console.log('🎯 CredentialLoaderService - Found credentials in memory backup (tenant validated)')
        return {
          apiKey: backup.apiKey,
          callAgentId: backup.callAgentId || '',
          smsAgentId: backup.smsAgentId || ''
        }
      }
    } catch (error) {
      console.warn('CredentialLoaderService - Error loading from memory backup:', error)
    }
    return {apiKey: '', callAgentId: '', smsAgentId: ''}
  }

  /**
   * Scan all user settings in localStorage for API keys (with tenant validation)
   *
   * @returns Partial credential data or empty strings
   */
  public static async scanAllUserSettings(): Promise<{apiKey: string, callAgentId: string, smsAgentId: string}> {
    try {
      console.log('🔍 CredentialLoaderService - Scanning all user settings for credentials...')

      // Get current tenant ID for validation
      const currentTenantId = getCurrentTenantId()

      const allKeys = Object.keys(localStorage)
      const settingsKeys = allKeys.filter(key => key.startsWith('settings_') && key !== 'settings_undefined')

      for (const key of settingsKeys) {
        try {
          const settings = JSON.parse(localStorage.getItem(key) || '{}')
          if (settings.retellApiKey) {
            // CRITICAL: Verify credentials belong to current tenant before using them
            const storedTenantId = settings.tenant_id

            // Skip credentials if they belong to a different tenant
            if (storedTenantId && storedTenantId !== currentTenantId) {
              console.warn(`⚠️ CredentialLoaderService - Skipping credentials from ${key} - belongs to tenant: ${storedTenantId} (current: ${currentTenantId})`)
              continue // Skip to next settings file
            }

            console.log(`🎯 CredentialLoaderService - Found credentials in ${key} (tenant validated:`, storedTenantId || 'no tenant_id', ')')
            return {
              apiKey: settings.retellApiKey,
              callAgentId: settings.callAgentId || '',
              smsAgentId: settings.smsAgentId || ''
            }
          }
        } catch (parseError) {
          console.warn(`CredentialLoaderService - Error parsing settings from ${key}:`, parseError)
        }
      }

      console.log('⚠️ CredentialLoaderService - No credentials found with matching tenant_id:', currentTenantId)
    } catch (error) {
      console.warn('CredentialLoaderService - Error scanning user settings:', error)
    }
    return {apiKey: '', callAgentId: '', smsAgentId: ''}
  }

  /**
   * Update retellService with loaded credentials
   *
   * @param credentials - Credentials to update in retellService
   */
  public static async updateRetellService(credentials: {apiKey: string, callAgentId: string, smsAgentId: string}): Promise<void> {
    try {
      const { retellService } = await import('./retellService')
      retellService.updateCredentials(
        credentials.apiKey || '',
        credentials.callAgentId || '',
        credentials.smsAgentId || ''
      )
      await retellService.ensureCredentialsLoaded()
      console.log('✅ CredentialLoaderService: Retell credentials updated from loaded source')
    } catch (error) {
      console.error('❌ CredentialLoaderService: Error updating retellService:', error)
      throw error
    }
  }
}
