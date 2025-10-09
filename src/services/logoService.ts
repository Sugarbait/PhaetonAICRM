/**
 * Logo Management Service
 * Handles uploading and storing company logos in Supabase
 * Enables cross-device synchronization of branding assets
 */

import { supabase, supabaseAdmin } from '@/config/supabase'
import { getCurrentTenantId } from '@/config/tenantConfig'

export interface CompanyLogos {
  headerLogo?: string
  footerLogoLight?: string
  footerLogoDark?: string
  favicon?: string
  lastUpdated?: string
}

class LogoService {
  private readonly STORAGE_BUCKET = 'company-logos'
  private readonly TABLE_NAME = 'company_settings'
  private cachedLogos: CompanyLogos | null = null

  /**
   * Initialize the logo service and create storage bucket if needed
   */
  async initialize(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(b => b.name === this.STORAGE_BUCKET)

      if (!bucketExists) {
        // Create public bucket for logos
        await supabase.storage.createBucket(this.STORAGE_BUCKET, {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon'],
          fileSizeLimit: 5242880 // 5MB
        })
      }
    } catch (error) {
      console.warn('Logo service initialization failed, using fallback:', error)
    }
  }

  /**
   * Upload a logo file to Supabase storage (Super Users Only)
   */
  async uploadLogo(file: File, type: 'header' | 'footer-light' | 'footer-dark' | 'favicon'): Promise<string | null> {
    try {
      // Security check: Verify user is a super user (this should be enforced on the backend as well)
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const user = JSON.parse(currentUser)
        if (user.role !== 'super_user') {
          console.error('Unauthorized: Only super users can upload company logos')
          throw new Error('Unauthorized: Only super users can upload company logos')
        }
      }
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
      }

      if (file.size > 5242880) {
        throw new Error('File size must be less than 5MB')
      }

      // Generate unique filename
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = `${type}_${timestamp}.${fileExt}`

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Logo upload failed:', error)
        return null
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(fileName)

      return publicUrl.publicUrl
    } catch (error) {
      console.error('Failed to upload logo:', error)
      return null
    }
  }

  /**
   * Convert file to base64 for localStorage fallback
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  /**
   * Upload logo with localStorage fallback
   */
  async uploadLogoWithFallback(file: File, type: 'header' | 'footer-light' | 'footer-dark' | 'favicon'): Promise<string | null> {
    try {
      // Try Supabase upload first
      const url = await this.uploadLogo(file, type)
      if (url) return url

      // Fallback to base64 in localStorage
      const base64 = await this.fileToBase64(file)
      return base64
    } catch (error) {
      console.error('Logo upload failed:', error)
      return null
    }
  }

  /**
   * Save company logos configuration (Super Users Only)
   */
  async saveLogos(logos: CompanyLogos): Promise<boolean> {
    try {
      console.log('💾 LogoService.saveLogos() - Starting save process')
      console.log('📦 Logos to save:', {
        headerLogo: logos.headerLogo ? `${logos.headerLogo.substring(0, 50)}... (${logos.headerLogo.length} chars)` : 'EMPTY',
        favicon: logos.favicon ? `${logos.favicon.substring(0, 50)}... (${logos.favicon.length} chars)` : 'EMPTY'
      })

      // Security check: Verify user is a super user
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const user = JSON.parse(currentUser)
        console.log('🔐 User role check:', user.role)
        if (user.role !== 'super_user') {
          console.error('❌ Unauthorized: Only super users can modify company logos')
          return false
        }
      }

      // Add timestamp
      logos.lastUpdated = new Date().toISOString()

      // Try to save to Supabase with tenant isolation
      const tenantId = getCurrentTenantId()
      console.log('🏢 Tenant ID:', tenantId)

      // Use admin client for RLS bypass (super user operations)
      const client = supabaseAdmin || supabase
      console.log('🔧 Using client:', supabaseAdmin ? 'supabaseAdmin (bypasses RLS)' : 'supabase (requires auth)')

      // First, check if a record exists for this tenant
      console.log('🔍 Checking for existing record...')
      const { data: existingRecord, error: checkError } = await client
        .from(this.TABLE_NAME)
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', 'company_logos')
        .maybeSingle()

      if (checkError) {
        console.error('❌ Error checking for existing record:', checkError)
      } else {
        console.log('📋 Existing record:', existingRecord ? `Found (ID: ${existingRecord.id})` : 'Not found - will insert new')
      }

      let error
      if (existingRecord) {
        // Update existing record
        console.log('🔄 Updating existing record...')
        const result = await client
          .from(this.TABLE_NAME)
          .update({
            name: 'company_logos', // Required field
            data: logos,
            updated_at: logos.lastUpdated
          })
          .eq('tenant_id', tenantId)
          .eq('name', 'company_logos')
          .select()

        error = result.error
        console.log('📊 Update result:', error ? `ERROR: ${error.message}` : `SUCCESS: ${JSON.stringify(result.data)}`)
      } else {
        // Insert new record (let Supabase generate UUID)
        console.log('➕ Inserting new record...')
        const result = await client
          .from(this.TABLE_NAME)
          .insert({
            tenant_id: tenantId,
            name: 'company_logos', // Required field
            category: 'general', // Required field
            data: logos,
            updated_at: logos.lastUpdated
          })
          .select()

        error = result.error
        console.log('📊 Insert result:', error ? `ERROR: ${error.message}` : `SUCCESS: ${JSON.stringify(result.data)}`)
      }

      if (!error) {
        console.log('✅ Logos saved to Supabase successfully for tenant:', tenantId)
        this.cachedLogos = logos
        // Also save to localStorage for offline access with tenant prefix
        localStorage.setItem(`${tenantId}_company_logos`, JSON.stringify(logos))
        console.log('💾 Also saved to localStorage as backup')

        // Dispatch event to notify other components (cross-tab sync)
        window.dispatchEvent(new Event('logoUpdated'))
        console.log('📡 logoUpdated event dispatched')

        return true
      } else {
        console.error('❌ Failed to save logos to Supabase:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        console.warn('⚠️ Falling back to localStorage only')
      }

      // Fallback to localStorage only with tenant prefix
      localStorage.setItem(`${tenantId}_company_logos`, JSON.stringify(logos))
      this.cachedLogos = logos
      console.log('💾 Saved to localStorage as fallback')
      return true
    } catch (error) {
      console.error('❌ Exception in saveLogos():', error)

      // Last resort: save to localStorage with tenant prefix
      try {
        const tenantId = getCurrentTenantId()
        localStorage.setItem(`${tenantId}_company_logos`, JSON.stringify(logos))
        this.cachedLogos = logos
        console.log('💾 Emergency save to localStorage successful')
        return true
      } catch (storageError) {
        console.error('❌ Even localStorage save failed:', storageError)
        return false
      }
    }
  }

  /**
   * Get company logos configuration
   */
  async getLogos(): Promise<CompanyLogos> {
    try {
      // Return cached if available
      if (this.cachedLogos) {
        return this.cachedLogos
      }

      // Try to fetch from Supabase with tenant isolation
      const tenantId = getCurrentTenantId()

      // Use regular client since we now have public read access policy
      // This works for both authenticated and unauthenticated users (login page)
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('data')
        .eq('tenant_id', tenantId)
        .eq('name', 'company_logos') // Only fetch company_logos settings
        .maybeSingle() // Use maybeSingle instead of single to avoid error if no record exists

      if (!error && data?.data) {
        console.log('✅ Logos loaded from Supabase for tenant:', tenantId)
        this.cachedLogos = data.data as CompanyLogos
        // Update localStorage cache with tenant prefix
        localStorage.setItem(`${tenantId}_company_logos`, JSON.stringify(this.cachedLogos))
        return this.cachedLogos
      } else if (error) {
        console.warn('⚠️ Failed to load logos from Supabase (falling back to localStorage):', error.message)
      }

      // Fallback to localStorage with tenant prefix
      const stored = localStorage.getItem(`${tenantId}_company_logos`)
      if (stored) {
        this.cachedLogos = JSON.parse(stored)
        return this.cachedLogos
      }

      // Return empty logos (no defaults)
      return {
        headerLogo: '',
        footerLogoLight: '',
        footerLogoDark: '',
        favicon: '' // Empty string instead of '/favicon.png' to prevent broken image
      }
    } catch (error) {
      console.error('Failed to get logos:', error)

      // Return empty logos (no defaults)
      return {
        headerLogo: '',
        footerLogoLight: '',
        footerLogoDark: '',
        favicon: '' // Empty string instead of '/favicon.png' to prevent broken image
      }
    }
  }

  /**
   * Delete a logo (Super Users Only)
   */
  async deleteLogo(type: 'header' | 'footer-light' | 'footer-dark' | 'favicon'): Promise<boolean> {
    try {
      console.log(`🗑️ LogoService: Starting deletion of ${type} logo`)

      // Security check: Verify user is a super user
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        const user = JSON.parse(currentUser)
        console.log(`🔐 LogoService: User role check: ${user.role}`)
        if (user.role !== 'super_user') {
          console.error('❌ LogoService: Unauthorized - Only super users can delete company logos')
          return false
        }
      }

      // Get current logos
      console.log(`📥 LogoService: Fetching current logos before deletion`)
      const logos = await this.getLogos()
      console.log(`📦 LogoService: Current logos state:`, {
        headerLogo: logos.headerLogo ? `EXISTS (${logos.headerLogo.length} chars)` : 'EMPTY',
        favicon: logos.favicon ? `EXISTS (${logos.favicon.length} chars)` : 'EMPTY'
      })

      // Set logo to empty string instead of deleting property
      // This ensures UI updates properly
      console.log(`🔧 LogoService: Setting ${type} to empty string`)
      switch (type) {
        case 'header':
          logos.headerLogo = ''
          console.log(`✏️ LogoService: Set headerLogo = ''`)
          break
        case 'footer-light':
          logos.footerLogoLight = ''
          console.log(`✏️ LogoService: Set footerLogoLight = ''`)
          break
        case 'footer-dark':
          logos.footerLogoDark = ''
          console.log(`✏️ LogoService: Set footerLogoDark = ''`)
          break
        case 'favicon':
          logos.favicon = '' // Set to empty string to hide broken image
          console.log(`✏️ LogoService: Set favicon = ''`)
          break
      }

      console.log(`📦 LogoService: Updated logos object:`, {
        headerLogo: logos.headerLogo ? `EXISTS (${logos.headerLogo.length} chars)` : 'EMPTY',
        favicon: logos.favicon ? `EXISTS (${logos.favicon.length} chars)` : 'EMPTY'
      })

      // Clear cache to force fresh load
      console.log(`🗑️ LogoService: Clearing cache`)
      this.clearCache()
      console.log(`✅ LogoService: Cache cleared`)

      // Explicitly clear localStorage before saving
      const tenantId = getCurrentTenantId()
      console.log(`🗑️ LogoService: Clearing localStorage for tenant: ${tenantId}`)
      localStorage.removeItem(`${tenantId}_company_logos`)
      console.log(`✅ LogoService: localStorage cleared`)

      // Save the updated logos
      console.log(`💾 LogoService: Saving updated logos to database`)
      const saved = await this.saveLogos(logos)
      console.log(`💾 LogoService: Save result:`, saved)

      if (saved) {
        console.log(`✅ LogoService: ${type} logo deleted successfully`)

        // Verify the deletion by fetching fresh data
        console.log(`🔍 LogoService: Verifying deletion by fetching fresh data`)
        this.clearCache() // Clear cache again before verification
        const verifyLogos = await this.getLogos()
        const verifyField = type === 'header' ? verifyLogos.headerLogo : verifyLogos.favicon
        console.log(`🔍 LogoService: Verification - ${type} is now:`, verifyField ? 'STILL HAS DATA ⚠️' : 'EMPTY ✅')
      } else {
        console.error(`❌ LogoService: Failed to save ${type} logo deletion`)
      }

      return saved
    } catch (error) {
      console.error('❌ LogoService: Exception during deletion:', error)
      return false
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cachedLogos = null
  }
}

// Export singleton instance
export const logoService = new LogoService()

// Initialize on module load
logoService.initialize().catch(console.error)