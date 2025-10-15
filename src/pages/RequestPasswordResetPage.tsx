import React, { useState } from 'react'
import { passwordResetService } from '@/services/passwordResetService'
import { MailIcon, ArrowLeftIcon } from 'lucide-react'
import { generalToast } from '@/services/generalToastService'
import { useNavigate } from 'react-router-dom'
import { useCompanyLogos } from '@/hooks/useCompanyLogos'

export const RequestPasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()
  const { logos } = useCompanyLogos()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await passwordResetService.requestPasswordReset(email)

      if (!result.success) {
        generalToast.error(
          result.error || result.message,
          'Reset Failed'
        )
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      generalToast.success(
        result.message,
        'Check Your Inbox'
      )
    } catch (error: any) {
      console.error('Password reset request failed:', error)
      generalToast.error(
        'An unexpected error occurred. Please try again later.',
        'Reset Failed'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            {logos.headerLogo && (
              <img
                src={logos.headerLogo}
                alt="Logo"
                className="max-h-20 w-auto mx-auto mb-4"
              />
            )}
            <MailIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Next steps:</strong>
            </p>
            <ol className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-decimal list-inside">
              <li>Check your inbox for an email from Phaeton AI CRM</li>
              <li>Click the "Reset Password" link in the email</li>
              <li>Enter your new password</li>
              <li>Sign in with your new credentials</li>
            </ol>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          {logos.headerLogo && (
            <img
              src={logos.headerLogo}
              alt="Logo"
              className="max-h-20 w-auto mx-auto mb-4"
            />
          )}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
