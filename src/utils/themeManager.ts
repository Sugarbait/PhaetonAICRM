/**
 * Theme Manager Utility
 * Handles application-wide dark mode theming
 */

export type Theme = 'light' | 'dark' | 'auto'

export class ThemeManager {
  private static readonly STORAGE_KEY = 'phaetonai_theme'

  /**
   * Apply theme to the HTML element
   */
  static applyTheme(theme: Theme): void {
    const html = document.documentElement

    if (theme === 'dark') {
      html.classList.add('dark')
    } else if (theme === 'light') {
      html.classList.remove('dark')
    } else if (theme === 'auto') {
      // Auto mode: respect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }

      // Listen for system theme changes
      this.watchSystemTheme()
    }
  }

  /**
   * Get the current theme from localStorage
   */
  static getCurrentTheme(): Theme {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored && ['light', 'dark', 'auto'].includes(stored)) {
        return stored as Theme
      }
    } catch (error) {
      console.warn('Failed to get theme from localStorage:', error)
    }
    return 'dark' // default to dark mode
  }

  /**
   * Save theme to localStorage
   */
  static saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }

  /**
   * Initialize theme system
   * Loads saved theme or defaults to light mode
   */
  static initialize(): void {
    // Get saved theme or default to light
    const theme = this.getCurrentTheme()
    this.applyTheme(theme)

    // Force re-application to ensure persistence
    setTimeout(() => {
      this.applyTheme(theme)
    }, 100)
  }

  /**
   * Watch for system theme changes in auto mode
   */
  private static watchSystemTheme(): void {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      const handleChange = (e: MediaQueryListEvent) => {
        const currentTheme = this.getCurrentTheme()
        if (currentTheme === 'auto') {
          if (e.matches) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      }

      // Remove existing listener to avoid duplicates
      mediaQuery.removeEventListener('change', handleChange)

      // Add new listener
      mediaQuery.addEventListener('change', handleChange)
    }
  }

  /**
   * Set theme and apply it immediately
   */
  static setTheme(theme: Theme): void {
    this.saveTheme(theme)
    this.applyTheme(theme)

    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme }
    }))
  }

  /**
   * Toggle between light and dark mode
   */
  static toggle(): void {
    const current = this.getCurrentTheme()
    if (current === 'dark') {
      this.setTheme('light')
    } else {
      this.setTheme('dark')
    }
  }

  /**
   * Check if dark mode is currently active
   */
  static isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark')
  }
}

// Initialize theme on module load
if (typeof window !== 'undefined') {
  // Initialize immediately
  ThemeManager.initialize()

  // Monitor DOM changes that might reset the theme
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const currentTheme = ThemeManager.getCurrentTheme()
          const shouldHaveDark = currentTheme === 'dark' ||
            (currentTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
          const hasDark = document.documentElement.classList.contains('dark')

          if (shouldHaveDark && !hasDark) {
            console.log('Theme class was removed, reapplying dark mode')
            document.documentElement.classList.add('dark')
          } else if (!shouldHaveDark && hasDark) {
            console.log('Theme class was added incorrectly, removing dark mode')
            document.documentElement.classList.remove('dark')
          }
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  }
}