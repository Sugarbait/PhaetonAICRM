/**
 * Favicon Manager
 * Dynamically updates browser favicon based on company logo settings
 * Enables cross-device synchronization via Supabase
 */

import { logoService } from '@/services/logoService'

export class FaviconManager {
  private static currentFavicon: string | null = null

  /**
   * Update the browser favicon dynamically
   */
  static async updateFavicon(): Promise<void> {
    try {
      // Get logos from Supabase-backed service
      const logos = await logoService.getLogos()

      // Use custom favicon if available, otherwise use default
      const faviconUrl = logos.favicon || '/images/artlee-favicon.png'

      // Only update if changed to avoid unnecessary DOM operations
      if (this.currentFavicon === faviconUrl) {
        return
      }

      this.currentFavicon = faviconUrl

      // Update all favicon link tags
      this.setFavicon(faviconUrl)

      console.log('✅ Favicon updated:', faviconUrl)
    } catch (error) {
      console.error('Failed to update favicon:', error)
      // Fallback to default on error
      this.setFavicon('/images/artlee-favicon.png')
    }
  }

  /**
   * Set favicon in the document head
   */
  private static setFavicon(url: string): void {
    // Remove existing favicon links
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]')
    existingFavicons.forEach(link => link.remove())

    // Create new favicon links
    const faviconLink = document.createElement('link')
    faviconLink.rel = 'icon'
    faviconLink.type = 'image/png'
    faviconLink.href = url
    document.head.appendChild(faviconLink)

    // Add shortcut icon (for older browsers)
    const shortcutLink = document.createElement('link')
    shortcutLink.rel = 'shortcut icon'
    shortcutLink.href = url
    document.head.appendChild(shortcutLink)

    // Add apple-touch-icon for iOS devices
    const appleTouchIcon = document.createElement('link')
    appleTouchIcon.rel = 'apple-touch-icon'
    appleTouchIcon.href = url
    document.head.appendChild(appleTouchIcon)
  }

  /**
   * Initialize favicon manager and listen for updates
   */
  static initialize(): void {
    // Update favicon on page load
    this.updateFavicon()

    // Listen for logo updates (same tab)
    window.addEventListener('logoUpdated', () => {
      console.log('Logo updated event detected - refreshing favicon')
      this.updateFavicon()
    })

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', (e) => {
      // Check if company logos changed in localStorage
      if (e.key && e.key.endsWith('_company_logos') && e.newValue) {
        console.log('Company logos changed in another tab - refreshing favicon')
        this.updateFavicon()
      }
    })
  }
}

// Export singleton methods
export const updateFavicon = () => FaviconManager.updateFavicon()
export const initializeFavicon = () => FaviconManager.initialize()
