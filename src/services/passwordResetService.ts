import { supabase } from '@/config/supabase'
import { getCurrentTenantId } from '@/config/tenantConfig'
import { auditLogger, AuditAction, ResourceType, AuditOutcome } from '@/services/auditLogger'

interface PasswordResetToken {
  id: string
  user_id: string
  token: string
  expires_at: string
  used_at: string | null
  created_at: string
  ip_address?: string
  user_agent?: string
}

interface ResetRequestResult {
  success: boolean
  message: string
  error?: string
}

interface TokenValidationResult {
  valid: boolean
  userId?: string
  error?: string
}

export class PasswordResetService {
  private static readonly TOKEN_EXPIRY_HOURS = 1
  private static readonly TOKEN_LENGTH = 64

  /**
   * Generate a cryptographically secure random token
   */
  private static generateSecureToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH / 2)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Get client IP and user agent for audit trail
   */
  private static getClientInfo() {
    return {
      ip_address: 'client-ip', // In production, get from headers
      user_agent: navigator.userAgent
    }
  }

  /**
   * Request a password reset - generates token and sends email
   */
  static async requestPasswordReset(email: string): Promise<ResetRequestResult> {
    try {
      console.log('🔐 Password Reset: Requesting reset for email:', email)

      // 1. Find user by email
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, name, tenant_id')
        .eq('email', email)
        .eq('tenant_id', getCurrentTenantId())
        .limit(1)

      if (userError) {
        console.error('Error finding user:', userError)
        // Return success anyway (security best practice - don't reveal if email exists)
        return {
          success: true,
          message: 'If an account exists with that email, you will receive a password reset link.'
        }
      }

      if (!users || users.length === 0) {
        console.log('⚠️ User not found for email:', email)
        // Return success anyway (security best practice)
        return {
          success: true,
          message: 'If an account exists with that email, you will receive a password reset link.'
        }
      }

      const user = users[0]
      console.log('✅ User found:', user.id)

      // 2. Generate secure token
      const token = this.generateSecureToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS)

      // 3. Store token in database
      const clientInfo = this.getClientInfo()
      const { error: insertError } = await supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          token,
          expires_at: expiresAt.toISOString(),
          ...clientInfo
        })

      if (insertError) {
        console.error('Error storing reset token:', insertError)
        throw new Error('Failed to create password reset token')
      }

      console.log('✅ Reset token created successfully')

      // 4. Send password reset email via Azure Function
      const resetUrl = `${window.location.origin}/reset-password?token=${token}`
      await this.sendResetEmail(user.email, user.name || user.email, resetUrl)

      // 5. Log audit event
      await auditLogger.logPHIAccess(
        AuditAction.SYSTEM,
        ResourceType.SYSTEM,
        `password-reset-request-${user.id}`,
        AuditOutcome.SUCCESS,
        { email: user.email, userId: user.id }
      )

      console.log('✅ Password reset email sent successfully')

      return {
        success: true,
        message: 'Password reset instructions have been sent to your email.'
      }

    } catch (error: any) {
      console.error('❌ Password reset request failed:', error)
      return {
        success: false,
        message: 'An error occurred. Please try again later.',
        error: error.message
      }
    }
  }

  /**
   * Send password reset email via Supabase Edge Function
   */
  private static async sendResetEmail(
    email: string,
    userName: string,
    resetUrl: string
  ): Promise<void> {
    try {
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #1e40af; padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 600;">Password Reset Request</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${userName},
              </p>

              <p style="color: #333333; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset your password for your Phaeton AI CRM account. Click the button below to create a new password:
              </p>

              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                This link will expire in <strong>1 hour</strong> for security reasons. If you didn't request this password reset, you can safely ignore this email.
              </p>

              <div style="background-color: #f0f4ff; border-left: 4px solid #1e40af; padding: 15px; margin: 25px 0; border-radius: 4px;">
                <p style="color: #1e40af; font-size: 13px; margin: 0; line-height: 1.5;">
                  <strong>Alternative Method:</strong><br>
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #1e40af; word-break: break-all;">${resetUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #666666; font-size: 13px; margin: 0 0 10px 0; line-height: 1.5;">
                <strong>Need help?</strong> Contact our support team at <a href="mailto:support@phaetonai.com" style="color: #1e40af; text-decoration: none;">support@phaetonai.com</a>
              </p>
              <p style="color: #999999; font-size: 11px; margin: 15px 0 0 0;">
                <strong>Security Notice:</strong> Phaeton AI CRM will never ask for your password via email.
              </p>
              <p style="color: #999999; font-size: 11px; margin: 15px 0 0 0;">
                © 2025 Phaeton AI CRM. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `

      // Call Supabase Edge Function to send email
      const { data, error } = await supabase.functions.invoke('send-email-notification', {
        body: {
          type: 'custom',
          recipients: [email],
          customSubject: 'Password Reset - Phaeton AI CRM',
          customHtml: emailHtml
        }
      })

      if (error) {
        console.error('Supabase function error:', error)
        throw new Error('Failed to send email via Supabase function')
      }

      if (!data?.success) {
        console.error('Email sending failed:', data)
        throw new Error('Email service failed to deliver message')
      }

      console.log('✅ Password reset email sent via Supabase Edge Function')

    } catch (error) {
      console.error('❌ Failed to send password reset email:', error)
      throw new Error('Failed to send password reset email')
    }
  }

  /**
   * Validate a password reset token
   */
  static async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      console.log('🔐 Validating password reset token')

      if (!token || token.length !== this.TOKEN_LENGTH) {
        return {
          valid: false,
          error: 'Invalid token format'
        }
      }

      // Query token from database
      const { data: tokens, error } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .is('used_at', null) // Only unused tokens
        .limit(1)

      if (error) {
        console.error('Error validating token:', error)
        return {
          valid: false,
          error: 'Token validation failed'
        }
      }

      if (!tokens || tokens.length === 0) {
        console.log('⚠️ Token not found or already used')
        return {
          valid: false,
          error: 'Invalid or expired token'
        }
      }

      const tokenData = tokens[0] as PasswordResetToken

      // Check if token is expired
      const expiresAt = new Date(tokenData.expires_at)
      if (expiresAt < new Date()) {
        console.log('⚠️ Token has expired')
        return {
          valid: false,
          error: 'Token has expired. Please request a new password reset.'
        }
      }

      console.log('✅ Token is valid')
      return {
        valid: true,
        userId: tokenData.user_id
      }

    } catch (error: any) {
      console.error('❌ Token validation error:', error)
      return {
        valid: false,
        error: 'Token validation failed'
      }
    }
  }

  /**
   * Reset password using a valid token
   */
  static async resetPassword(token: string, newPassword: string): Promise<ResetRequestResult> {
    try {
      console.log('🔐 Resetting password with token')

      // 1. Validate token
      const validation = await this.validateToken(token)
      if (!validation.valid || !validation.userId) {
        return {
          success: false,
          message: validation.error || 'Invalid token',
          error: validation.error
        }
      }

      const userId = validation.userId

      // 2. Update user password in Supabase Auth
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      )

      if (updateError) {
        console.error('Error updating password:', updateError)
        throw new Error('Failed to update password')
      }

      console.log('✅ Password updated successfully')

      // 3. Mark token as used
      const { error: tokenError } = await supabase
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', token)

      if (tokenError) {
        console.warn('⚠️ Failed to mark token as used:', tokenError)
        // Don't fail the operation - password was already updated
      }

      // 4. Log audit event
      await auditLogger.logPHIAccess(
        AuditAction.SYSTEM,
        ResourceType.SYSTEM,
        `password-reset-complete-${userId}`,
        AuditOutcome.SUCCESS,
        { userId }
      )

      console.log('✅ Password reset completed successfully')

      return {
        success: true,
        message: 'Your password has been reset successfully. You can now sign in with your new password.'
      }

    } catch (error: any) {
      console.error('❌ Password reset failed:', error)
      return {
        success: false,
        message: 'Failed to reset password. Please try again or request a new reset link.',
        error: error.message
      }
    }
  }

  /**
   * Cleanup expired tokens (call periodically)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const { error } = await supabase.rpc('cleanup_expired_password_reset_tokens')

      if (error) {
        console.error('Error cleaning up expired tokens:', error)
      } else {
        console.log('✅ Expired password reset tokens cleaned up')
      }
    } catch (error) {
      console.error('❌ Token cleanup failed:', error)
    }
  }
}

export const passwordResetService = PasswordResetService
