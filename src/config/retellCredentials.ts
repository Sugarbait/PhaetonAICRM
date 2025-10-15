/**
 * Retell AI API Credentials Configuration
 *
 * For Phaeton AI CRM, no credentials are hardcoded.
 * Users must configure their own API keys via Settings > API Configuration.
 *
 * This file provides the structure and validation utilities only.
 */

export interface RetellCredentials {
  apiKey: string
  callAgentId: string
  smsAgentId: string
}

/**
 * Phaeton AI CRM - User Configuration Required
 *
 * No hardcoded credentials for Phaeton AI CRM.
 * Users configure their own Retell AI credentials via Settings > API Configuration.
 *
 * Credentials are stored in:
 * - localStorage (primary)
 * - Supabase database (cloud sync)
 *
 * Required credential format:
 * 1. API Key (format: key_xxxxxxxxxxxxxxxxxxxxx)
 * 2. Call Agent ID (format: agent_xxxxxxxxxxxxxxxxxxxxx)
 * 3. SMS Agent ID (format: agent_xxxxxxxxxxxxxxxxxxxxx - optional)
 */
/**
 * Phaeton AI CRM - User Configuration Required
 * Last Updated: 2025-10-11
 *
 * IMPORTANT: No hardcoded credentials for Phaeton AI CRM.
 * Users MUST configure their own API keys via Settings > API Configuration.
 *
 * When credentials are blank:
 * - Error messages will be displayed on all pages
 * - All metrics will show $0.00 values
 * - No data will be fetched from Retell AI API
 */
export const HARDCODED_RETELL_CREDENTIALS: RetellCredentials = {
  // No hardcoded API Key - users must configure via Settings
  apiKey: '',

  // No hardcoded Call Agent ID - users must configure via Settings
  callAgentId: '',

  // No hardcoded SMS Agent ID - users must configure via Settings
  smsAgentId: ''
}

/**
 * Credential validation utility
 * Note: SMS Agent ID is optional - can be empty string if SMS functionality is not configured
 */
export function validateCredentials(credentials: Partial<RetellCredentials>): boolean {
  // Allow all empty credentials (user hasn't configured yet)
  if (!credentials.apiKey && !credentials.callAgentId && !credentials.smsAgentId) {
    return true
  }

  const hasValidApiKey = !!(credentials.apiKey && credentials.apiKey.startsWith('key_'))
  const hasValidCallAgent = !!(credentials.callAgentId && credentials.callAgentId.startsWith('agent_'))
  const hasValidSmsAgent = !credentials.smsAgentId || credentials.smsAgentId.startsWith('agent_')

  return hasValidApiKey && hasValidCallAgent && hasValidSmsAgent
}

/**
 * Get bulletproof credentials with validation
 *
 * For Phaeton AI CRM: This always returns empty credentials.
 * Users MUST configure credentials via Settings > API Configuration.
 */
export function getBulletproofCredentials(): RetellCredentials {
  const credentials = { ...HARDCODED_RETELL_CREDENTIALS }

  console.log('⚠️ Phaeton AI: No hardcoded credentials - waiting for user configuration')
  console.log('   API Key:', credentials.apiKey || 'NOT SET - Configure in Settings')
  console.log('   Call Agent ID:', credentials.callAgentId || 'NOT SET - Configure in Settings')
  console.log('   SMS Agent ID:', credentials.smsAgentId || 'NOT SET - Configure in Settings')

  return credentials
}

/**
 * Backup credential storage keys for multi-layer persistence
 */
export const CREDENTIAL_STORAGE_KEYS = {
  // Primary storage locations
  LOCALSTORAGE_PREFIX: 'settings_',
  SESSION_BACKUP_KEY: 'retell_credentials_backup',
  MEMORY_BACKUP_KEY: '__retellCredentialsBackup',

  // Cloud storage keys
  SUPABASE_SYSTEM_DEFAULTS: 'system_retell_defaults',
  SUPABASE_USER_SETTINGS: 'user_settings',

  // Emergency recovery keys
  EMERGENCY_RECOVERY_KEY: '__emergencyRetellCredentials',
  FALLBACK_CONFIG_KEY: '__fallbackRetellConfig'
} as const

/**
 * Store credentials in multiple locations for maximum persistence
 */
export function storeCredentialsEverywhere(credentials: RetellCredentials): void {
  try {
    // CRITICAL FIX: Don't store credentials if user just logged out
    if (typeof localStorage !== 'undefined') {
      const justLoggedOut = localStorage.getItem('justLoggedOut')
      if (justLoggedOut === 'true') {
        console.log('🛑 User just logged out - not storing credentials anywhere')
        return
      }
    }

    // Store in sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(CREDENTIAL_STORAGE_KEYS.SESSION_BACKUP_KEY, JSON.stringify({
        ...credentials,
        timestamp: Date.now(),
        source: 'hardcoded_persistence'
      }))
    }

    // Store in memory backup
    if (typeof window !== 'undefined') {
      (window as any)[CREDENTIAL_STORAGE_KEYS.MEMORY_BACKUP_KEY] = {
        ...credentials,
        timestamp: Date.now(),
        source: 'hardcoded_persistence'
      }
    }

    // Store in emergency recovery
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CREDENTIAL_STORAGE_KEYS.EMERGENCY_RECOVERY_KEY, JSON.stringify({
        ...credentials,
        timestamp: Date.now(),
        source: 'hardcoded_persistence'
      }))
    }

    console.log('✅ Credentials stored in all persistence layers')
  } catch (error) {
    console.warn('⚠️ Error storing credentials in some locations:', error)
  }
}

/**
 * Initialize hardcoded credential persistence on module load
 *
 * DISABLED FOR PHAETON AI CRM:
 * No hardcoded credentials - users must configure via Settings.
 * This function is kept for interface compatibility but does nothing.
 */
export function initializeCredentialPersistence(): void {
  console.log('⚠️ Phaeton AI: Credential auto-initialization DISABLED')
  console.log('   Users must configure API keys via Settings > API Configuration')
  console.log('   No hardcoded fallback credentials available')

  // Do nothing - no credentials to initialize
  return
}

// Auto-initialization DISABLED for Phaeton AI CRM
// Users MUST configure credentials via Settings > API Configuration
// if (typeof window !== 'undefined') {
//   // DISABLED - No hardcoded credentials for Phaeton AI
//   console.log('⚠️ Phaeton AI: Auto-initialization of credentials DISABLED')
// }