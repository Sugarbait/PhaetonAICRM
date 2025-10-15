import React, { useState, useEffect } from 'react'
import { passwordResetService } from '@/services/passwordResetService'
import { CheckCircleIcon, AlertCircleIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { generalToast } from '@/services/generalToastService'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCompanyLogos } from '@/hooks/useCompanyLogos'

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')
  const navigate = useNavigate()
  const { logos } = useCompanyLogos()

  // Validate token on mount
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Invalid password reset link. Please request a new password reset.')
      setTokenValid(false)
      return
    }

    setToken(tokenParam)

    // Validate token
    passwordResetService.validateToken(tokenParam).then(result => {
      if (result.valid) {
        setTokenValid(true)
      } else {
        setError(result.error || 'Invalid or expired token. Please request a new password reset.')
        setTokenValid(false)
      }
    })
  }, [searchParams])

  // Password strength calculator
  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordStrength('weak')
      return
    }

    let strength = 0
    if (newPassword.length >= 8) strength++
    if (newPassword.length >= 12) strength++
    if (/[A-Z]/.test(newPassword)) strength++
    if (/[a-z]/.test(newPassword)) strength++
    if (/[0-9]/.test(newPassword)) strength++
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++

    if (strength <= 2) setPasswordStrength('weak')
    else if (strength <= 4) setPasswordStrength('medium')
    else setPasswordStrength('strong')
  }, [newPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Check token validity first
    if (!token || tokenValid === false) {
      setError('Invalid password reset link. Please request a new password reset.')
      return
    }

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordStrength === 'weak') {
      setError('Please choose a stronger password')
      return
    }

    setIsLoading(true)

    try {
      const result = await passwordResetService.resetPassword(token, newPassword)

      if (!result.success) {
        setError(result.error || result.message)
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
        'Password Reset Complete'
      )

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error: any) {
      console.error('Password reset failed:', error)
      setError('An unexpected error occurred. Please try again.')
      generalToast.error(
        'An unexpected error occurred. Please try the reset process again.',
        'Reset Failed'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while validating token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <div className="text-center">
            {logos.headerLogo && (
              <img
                src={logos.headerLogo}
                alt="Logo"
                className="max-h-20 w-auto mx-auto mb-4"
              />
            )}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Validating Reset Link...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Please wait while we verify your password reset link.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <div className="text-center">
            {logos.headerLogo && (
              <img
                src={logos.headerLogo}
                alt="Logo"
                className="max-h-20 w-auto mx-auto mb-4"
              />
            )}
            <AlertCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/request-password-reset')}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition"
              >
                Request New Reset Link
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <div className="text-center">
            {logos.headerLogo && (
              <img
                src={logos.headerLogo}
                alt="Logo"
                className="max-h-20 w-auto mx-auto mb-4"
              />
            )}
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Password Reset Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Your password has been successfully reset. You will be redirected to the login page in a few seconds.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition"
            >
              Go to Login Now
            </button>
          </div>
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
            Set New Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Choose a strong password for your account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-5 h-5 text-gray-400" />
                ) : (
                  <EyeIcon className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === 'weak'
                          ? 'w-1/3 bg-red-500'
                          : passwordStrength === 'medium'
                          ? 'w-2/3 bg-yellow-500'
                          : 'w-full bg-green-500'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength === 'weak'
                        ? 'text-red-600 dark:text-red-400'
                        : passwordStrength === 'medium'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {passwordStrength === 'weak'
                      ? 'Weak'
                      : passwordStrength === 'medium'
                      ? 'Medium'
                      : 'Strong'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
            {confirmPassword && (
              <div className="mt-1 text-sm">
                {newPassword === confirmPassword ? (
                  <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    Passwords match
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircleIcon className="w-4 h-4" />
                    Passwords do not match
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <p className="text-xs text-blue-900 dark:text-blue-100 font-medium mb-1">
              Password Requirements:
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-0.5">
              <li>• At least 8 characters long</li>
              <li>• Mix of uppercase and lowercase letters</li>
              <li>• Include numbers and special characters</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading || passwordStrength === 'weak' || newPassword !== confirmPassword}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
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
