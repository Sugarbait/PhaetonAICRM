/**
 * General Toast Component
 * Displays success, error, info, and warning toast messages
 * Replaces browser alert() dialogs with on-screen notifications
 */

import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { generalToast, ToastMessage } from '@/services/generalToastService'

interface ToastItemProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss()
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast])

  const handleDismiss = () => {
    setIsAnimating(true)
    setTimeout(() => {
      onDismiss(toast.id)
    }, 200)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-500'
      case 'error':
        return 'border-red-500'
      case 'warning':
        return 'border-amber-500'
      default:
        return 'border-blue-500'
    }
  }

  const getProgressColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'warning':
        return 'bg-amber-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 border-l-4 ${getBorderColor()}
        rounded-lg shadow-lg p-4 mb-3 transition-all duration-200
        ${isAnimating ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'}
      `}
      style={{
        minWidth: '320px',
        maxWidth: '400px'
      }}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {toast.title}
            </div>
          )}
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {toast.message}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                     transition-colors rounded flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
        <div
          className={`${getProgressColor()} h-1 rounded-full transition-all ease-linear`}
          style={{
            animation: `shrink ${toast.duration}ms linear forwards`
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}

export const GeneralToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const unsubscribe = generalToast.subscribe((toast) => {
      setToasts(prev => [...prev, toast])
    })

    return unsubscribe
  }, [])

  const handleDismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  )
}
