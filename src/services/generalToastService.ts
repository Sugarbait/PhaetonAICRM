/**
 * General Toast Notification Service
 * Provides simple toast notifications for success, error, info, and warning messages
 * Replaces browser alert() calls with on-screen notifications
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

type ToastCallback = (toast: ToastMessage) => void

class GeneralToastService {
  private callbacks: Set<ToastCallback> = new Set()
  private toastCounter = 0

  /**
   * Subscribe to toast notifications
   */
  subscribe(callback: ToastCallback): () => void {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * Show a toast notification
   */
  private show(type: ToastType, message: string, title?: string, duration?: number): void {
    const toast: ToastMessage = {
      id: `toast-${Date.now()}-${this.toastCounter++}`,
      type,
      title,
      message,
      duration: duration || 5000
    }

    this.callbacks.forEach(callback => callback(toast))
  }

  /**
   * Show success toast
   */
  success(message: string, title?: string, duration?: number): void {
    this.show('success', message, title, duration)
  }

  /**
   * Show error toast
   */
  error(message: string, title?: string, duration?: number): void {
    this.show('error', message, title, duration)
  }

  /**
   * Show info toast
   */
  info(message: string, title?: string, duration?: number): void {
    this.show('info', message, title, duration)
  }

  /**
   * Show warning toast
   */
  warning(message: string, title?: string, duration?: number): void {
    this.show('warning', message, title, duration)
  }
}

// Export singleton instance
export const generalToast = new GeneralToastService()
