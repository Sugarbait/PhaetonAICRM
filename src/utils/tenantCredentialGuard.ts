/**
 * Tenant Credential Guard
 *
 * Prevents cross-tenant credential contamination by validating localStorage credentials
 * against the current tenant ID. Automatically clears credentials from other tenants.
 *
 * This is critical for Phaeton AI CRM to prevent loading ARTLEE/CareXPS credentials.
 */

import { getCurrentTenantId } from '@/config/tenantConfig'

export interface TenantValidationResult {
  isValid: boolean
  action: 'validated' | 'cleared' | 'no_credentials'
  details: string
  clearedKeys: string[]
}

/**
 * Validate and clean localStorage credentials for current tenant
 * Call this on app initialization to prevent cross-tenant credential loading
 */
export async function validateAndCleanTenantCredentials(): Promise<TenantValidationResult> {
  try {
    const currentTenantId = getCurrentTenantId()
    const storedTenantId = localStorage.getItem('current_tenant_id')
    const clearedKeys: string[] = []

    console.log('🔐 [TENANT GUARD] Validating credentials for tenant:', currentTenantId)

    // Check if this is a tenant switch
    if (storedTenantId && storedTenantId !== currentTenantId) {
      console.warn(`⚠️ [TENANT GUARD] Tenant switch detected: ${storedTenantId} → ${currentTenantId}`)
      console.log('🗑️ [TENANT GUARD] Clearing old tenant credentials from localStorage...')

      // Clear all settings_* entries (they belong to the old tenant)
      Object.keys(localStorage)
        .filter(key => key.startsWith('settings_'))
        .forEach(key => {
          console.log(`   Clearing: ${key}`)
          localStorage.removeItem(key)
          clearedKeys.push(key)
        })

      // Also clear credential backups
      localStorage.removeItem('retell_credentials_backup')
      sessionStorage.removeItem('retell_credentials_backup')

      console.log(`✅ [TENANT GUARD] Cleared ${clearedKeys.length} old credential entries`)

      // Update stored tenant ID
      localStorage.setItem('current_tenant_id', currentTenantId)

      return {
        isValid: false,
        action: 'cleared',
        details: `Cleared ${clearedKeys.length} credential entries from previous tenant (${storedTenantId})`,
        clearedKeys
      }
    }

    // No tenant switch detected
    if (!storedTenantId) {
      console.log('ℹ️ [TENANT GUARD] First initialization - setting current tenant ID')
      localStorage.setItem('current_tenant_id', currentTenantId)
    }

    // Validate existing credentials (if any)
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    if (currentUser.id) {
      const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}')

      if (settings.retellApiKey || settings.callAgentId || settings.smsAgentId) {
        const credentialTenantId = settings.tenant_id || currentUser.tenant_id

        if (credentialTenantId && credentialTenantId !== currentTenantId) {
          console.warn(`⚠️ [TENANT GUARD] Found credentials with mismatched tenant_id: ${credentialTenantId}`)
          console.log('🗑️ [TENANT GUARD] Clearing mismatched credentials...')

          localStorage.removeItem(`settings_${currentUser.id}`)
          clearedKeys.push(`settings_${currentUser.id}`)

          return {
            isValid: false,
            action: 'cleared',
            details: `Cleared credentials with mismatched tenant_id (${credentialTenantId} vs ${currentTenantId})`,
            clearedKeys
          }
        }

        console.log('✅ [TENANT GUARD] Credentials validated for current tenant:', currentTenantId)
        return {
          isValid: true,
          action: 'validated',
          details: `Credentials belong to correct tenant (${currentTenantId})`,
          clearedKeys: []
        }
      }
    }

    console.log('ℹ️ [TENANT GUARD] No credentials found - user will configure via Settings')
    return {
      isValid: true,
      action: 'no_credentials',
      details: 'No credentials configured yet',
      clearedKeys: []
    }
  } catch (error) {
    console.error('❌ [TENANT GUARD] Error during validation:', error)
    return {
      isValid: false,
      action: 'no_credentials',
      details: `Error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      clearedKeys: []
    }
  }
}

/**
 * Force clear all credentials from localStorage
 * Use this when you need to completely reset credential storage
 */
export function forceCleanAllCredentials(): number {
  const clearedCount = Object.keys(localStorage)
    .filter(key => key.startsWith('settings_') || key.includes('credential'))
    .length

  Object.keys(localStorage)
    .filter(key => key.startsWith('settings_') || key.includes('credential'))
    .forEach(key => localStorage.removeItem(key))

  sessionStorage.removeItem('retell_credentials_backup')
  localStorage.removeItem('current_tenant_id')

  console.log(`🗑️ [TENANT GUARD] Force cleared ${clearedCount} credential entries`)
  return clearedCount
}

/**
 * Check if credentials exist and are valid for current tenant
 */
export function hasValidTenantCredentials(): boolean {
  try {
    const currentTenantId = getCurrentTenantId()
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')

    if (!currentUser.id) {
      return false
    }

    const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}')

    if (!settings.retellApiKey) {
      return false
    }

    const credentialTenantId = settings.tenant_id || currentUser.tenant_id

    return !credentialTenantId || credentialTenantId === currentTenantId
  } catch (error) {
    console.error('[TENANT GUARD] Error checking credentials:', error)
    return false
  }
}

/**
 * Get diagnostic information about current credential state
 */
export function getTenantCredentialDiagnostics(): {
  currentTenantId: string
  storedTenantId: string | null
  hasCredentials: boolean
  credentialTenantId: string | null
  isValid: boolean
  settingsKeys: string[]
} {
  const currentTenantId = getCurrentTenantId()
  const storedTenantId = localStorage.getItem('current_tenant_id')
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
  const settings = currentUser.id ? JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}') : {}
  const settingsKeys = Object.keys(localStorage).filter(key => key.startsWith('settings_'))

  return {
    currentTenantId,
    storedTenantId,
    hasCredentials: !!(settings.retellApiKey || settings.callAgentId || settings.smsAgentId),
    credentialTenantId: settings.tenant_id || currentUser.tenant_id || null,
    isValid: hasValidTenantCredentials(),
    settingsKeys
  }
}
