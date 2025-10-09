/**
 * Confirmation Modal Component
 * Replaces browser confirm() dialogs with on-screen modals
 */

import React from 'react'
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  type?: 'info' | 'warning' | 'danger' | 'success'
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  customIcon?: React.ReactNode
  richContent?: React.ReactNode
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  customIcon,
  richContent
}) => {
  if (!isOpen) return null

  const getIcon = () => {
    if (customIcon) return customIcon

    switch (type) {
      case 'danger':
        return <XCircle className="w-12 h-12 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-amber-500" />
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />
      default:
        return <Info className="w-12 h-12 text-blue-500" />
    }
  }

  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700'
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700'
      case 'success':
        return 'bg-green-600 hover:bg-green-700'
      default:
        return 'bg-blue-600 hover:bg-blue-700'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          {richContent ? (
            richContent
          ) : (
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {message}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${getButtonColor()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Custom hook for easier usage
export const useConfirmation = () => {
  const [confirmState, setConfirmState] = React.useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'info' | 'warning' | 'danger' | 'success'
    confirmText: string
    cancelText: string
    onConfirm: () => void
    customIcon?: React.ReactNode
    richContent?: React.ReactNode
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: () => {}
  })

  const confirm = (options: {
    title: string
    message: string
    type?: 'info' | 'warning' | 'danger' | 'success'
    confirmText?: string
    cancelText?: string
    customIcon?: React.ReactNode
    richContent?: React.ReactNode
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title: options.title,
        message: options.message,
        type: options.type || 'warning',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        customIcon: options.customIcon,
        richContent: options.richContent,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        }
      })
    })
  }

  const handleCancel = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }))
  }

  const ConfirmationDialog = () => (
    <ConfirmationModal
      isOpen={confirmState.isOpen}
      title={confirmState.title}
      message={confirmState.message}
      type={confirmState.type}
      confirmText={confirmState.confirmText}
      cancelText={confirmState.cancelText}
      customIcon={confirmState.customIcon}
      richContent={confirmState.richContent}
      onConfirm={confirmState.onConfirm}
      onCancel={handleCancel}
    />
  )

  return { confirm, ConfirmationDialog }
}
