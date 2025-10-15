/**
 * Tenant Credential Configuration
 *
 * Defines which user's settings should be used as the "primary" credential source
 * for each tenant. All users in the tenant will read/write credentials to this
 * user's user_settings record, ensuring automatic synchronization.
 *
 * Created: 2025-10-12
 */

export interface TenantCredentialOwner {
  tenantId: string
  primaryUserId: string // User ID whose settings act as shared credential storage
  primaryUserEmail: string // For reference/debugging
}

/**
 * Tenant-level credential ownership configuration
 *
 * Maps each tenant to a "primary user" whose user_settings record
 * serves as the shared credential storage for all users in that tenant.
 */
export const TENANT_CREDENTIAL_OWNERS: Record<string, TenantCredentialOwner> = {
  'phaeton_ai': {
    tenantId: 'phaeton_ai',
    primaryUserId: '166b5086-5ec5-49f3-9eff-68f75d0c8e79', // Pierre's user ID
    primaryUserEmail: 'pierre@phaetonai.com'
  },
  'medex': {
    tenantId: 'medex',
    primaryUserId: 'TBD', // To be configured when MedEx needs shared credentials
    primaryUserEmail: 'TBD'
  },
  'artlee': {
    tenantId: 'artlee',
    primaryUserId: 'TBD', // To be configured when ARTLEE needs shared credentials
    primaryUserEmail: 'TBD'
  },
  'carexps': {
    tenantId: 'carexps',
    primaryUserId: 'TBD', // To be configured when CareXPS needs shared credentials
    primaryUserEmail: 'TBD'
  }
}

/**
 * Get the primary user ID for a tenant (credential owner)
 *
 * @param tenantId - The tenant ID
 * @returns The primary user ID for credential storage, or null if not configured
 */
export function getPrimaryCredentialUserId(tenantId: string): string | null {
  const owner = TENANT_CREDENTIAL_OWNERS[tenantId]
  if (!owner || owner.primaryUserId === 'TBD') {
    console.warn(`⚠️ No primary credential user configured for tenant: ${tenantId}`)
    return null
  }
  return owner.primaryUserId
}

/**
 * Check if shared credentials are enabled for a tenant
 *
 * @param tenantId - The tenant ID
 * @returns True if tenant has shared credentials configured
 */
export function hasSharedCredentials(tenantId: string): boolean {
  const primaryUserId = getPrimaryCredentialUserId(tenantId)
  return primaryUserId !== null
}

/**
 * Get credential owner info for debugging
 *
 * @param tenantId - The tenant ID
 * @returns Credential owner configuration or null
 */
export function getCredentialOwnerInfo(tenantId: string): TenantCredentialOwner | null {
  const owner = TENANT_CREDENTIAL_OWNERS[tenantId]
  if (!owner || owner.primaryUserId === 'TBD') {
    return null
  }
  return owner
}
