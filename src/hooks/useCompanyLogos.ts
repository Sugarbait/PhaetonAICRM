/**
 * Hook to manage company logos across the application
 */

import { useState, useEffect } from 'react'
import { logoService, CompanyLogos } from '@/services/logoService'
import { getCurrentTenantId } from '@/config/tenantConfig'

export const useCompanyLogos = () => {
  const [logos, setLogos] = useState<CompanyLogos>({
    headerLogo: '',
    footerLogoLight: '',
    footerLogoDark: '',
    favicon: '/favicon.png'
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLogos = async () => {
      try {
        const companyLogos = await logoService.getLogos()
        setLogos(companyLogos)
      } catch (error) {
        console.error('Failed to load company logos:', error)
        // Keep default logos on error
      } finally {
        setIsLoading(false)
      }
    }

    loadLogos()

    // Listen for storage changes to sync across tabs (tenant-specific)
    const tenantId = getCurrentTenantId()
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${tenantId}_company_logos` && e.newValue) {
        try {
          const updatedLogos = JSON.parse(e.newValue)
          setLogos(updatedLogos)
        } catch (error) {
          console.error('Failed to parse logos from storage:', error)
        }
      }
    }

    // Listen for custom logo update event (same tab)
    const handleLogoUpdate = () => {
      loadLogos()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('logoUpdated', handleLogoUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('logoUpdated', handleLogoUpdate)
    }
  }, [])

  return { logos, isLoading }
}