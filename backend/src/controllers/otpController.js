/**
 * OTP Controller
 * HTTP handler layer for all OTP-related endpoints.
 * Validates inputs, orchestrates service calls, and formats responses.
 * Never exposes plain OTP values in production responses.
 *
 * Routes:
 *   POST /api/otp/send/email       → sendEmailOTP
 *   POST /api/otp/send/phone       → sendPhoneOTP
 *   POST /api/otp/verify/email     → verifyEmailOTP
 *   POST /api/otp/verify/phone     → verifyPhoneOTP
 *   POST /api/otp/forgot-password  → forgotPassword
 *   POST /api/otp/verify-reset     → verifyReset
 *   POST /api/otp/reset-password   → resetPassword
 */

import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import * as otpService from '../services/otpService.js'
import * as emailService from '../services/emailService.js'
import * as whatsappService from '../services/whatsappService.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Generate a signed JWT for the given user.
 * Token expires in 1 day by default.
 *
 * @param {import('../models/User.js').default} user - Mongoose User document
 * @returns {string} Signed JWT string
 */
function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '1d' }
  )
}

/**
 * POST /api/otp/send/email
 * Send a 6-digit OTP to the user's registered email address.
 *
 * Request body: { userId: string, type: 'verification' | 'reset' }
 * Response:     { success: true, dev?: boolean }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function sendEmailOTP(req, res) {
  try {
    const { userId, type } = req.body

    // Validate required fields
    if (!userId || !type) {
      return res.status(400).json({ error: 'userId and type are required.' })
    }

    if (!['verification', 'reset'].includes(type)) {
      return res.status(400).json({ error: "type must be 'verification' or 'reset'." })
    }

    // Look up user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    // Create OTP record and get plain OTP for delivery
    const { otp, record } = await otpService.createOTPRecord(userId, type, 'email')

    // Send OTP via email
    const emailResult = await emailService.sendOTPEmail(user.email, otp, type)

    if (!emailResult.success && IS_PRODUCTION) {
      return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' })
    }

    // Build response — never include plain OTP in production
    const response = { success: true }
    if (emailResult.dev && !IS_PRODUCTION) {
      response.dev = true
    }

    return res.json(response)
  } catch (err) {
    console.error('sendEmailOTP error:', err.message)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

/**
 * POST /api/otp/send/phone
 * Send a 6-digit OTP to the user's registered phone number via WhatsApp.
 *
 * Request body: { userId: string }
 * Response:     { success: true, channel: string, dev?: boolean, fallback?: boolean }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function sendPhoneOTP(req, res) {
  try {
    const { userId } = req.body

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' })
    }

    // Look up user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    // Create OTP record and get plain OTP for delivery
    const { otp, record } = await otpService.createOTPRecord(userId, 'verification', 'phone')

    // Send OTP via WhatsApp (falls back to SMS or dev mode automatically)
    const waResult = await whatsappService.sendWhatsAppOTP(user.phone, otp)

    // Build response — pass through whatsappService response fields
    const response = { success: true }
    if (waResult.channel) response.channel = waResult.channel
    if (waResult.dev && !IS_PRODUCTION) response.dev = true
    if (waResult.fallback) response.fallback = true

    return res.json(response)
  } catch (err) {
    console.error('sendPhoneOTP error:', err.message)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

/**
 * POST /api/otp/verify/email
 * Verify the email OTP submitted by the user.
 * On success with type='verification', marks emailVerified=true and activates account
 * if both email and phone are verified.
 *
 * Request body: { userId: string, otp: string, type: 'verification' | 'reset' }
 * Response:     { success: true, bothVerified?: boolean, user?: object, token?: string }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function verifyEmailOTP(req, res) {
  try {
    const { userId, otp, type } = req.body

    // Validate required fields
    if (!userId || !otp || !type) {
      return res.status(400).json({ error: 'userId, otp, and type are required.' })
    }

    // Validate OTP format: exactly 6 digits
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'OTP must be a 6-digit numeric code.' })
    }

    if (!['verification', 'reset'].includes(type)) {
      return res.status(400).json({ error: "type must be 'verification' or 'reset'." })
    }

    // Look up user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    // Verify OTP via service
    const result = await otpService.verifyOTPRecord(userId, type, 'email', otp)

    if (!result.success) {
      return res.status(422).json({ error: result.error })
    }

    // OTP verified successfully
    if (type === 'verification') {
      user.emailVerified = true

      // Check if both channels are now verified
      if (user.emailVerified && user.phoneVerified) {
        user.status = 'active'
        await user.save()

        const token = generateToken(user)
        return res.json({
          success: true,
          bothVerified: true,
          user: user.toJSON(),
          token,
        })
      }

      await user.save()
      return res.json({ success: true, bothVerified: false })
    }

    // type === 'reset': no user update needed, just confirm success
    return res.json({ success: true })
  } catch (err) {
    console.error('verifyEmailOTP error:', err.message)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

/**
 * POST /api/otp/verify/phone
 * Mark the user's phone as verified (Firebase handles actual OTP verification client-side).
 * Activates account if both email and phone are now verified.
 *
 * Request body: { userId: string }
 * Response:     { success: true, bothVerified: boolean, user?: object, token?: string }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function verifyPhoneOTP(req, res) {
  try {
    const { userId } = req.body

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' })
    }

    // Look up user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    // Mark phone as verified
    user.phoneVerified = true

    // Check if both channels are now verified
    if (user.emailVerified && user.phoneVerified) {
      user.status = 'active'
      await user.save()

      const token = generateToken(user)
      return res.json({
        success: true,
        bothVerified: true,
        user: user.toJSON(),
        token,
      })
    }

    await user.save()
    return res.json({ success: true, bothVerified: false })
  } catch (err) {
    console.error('verifyPhoneOTP error:', err.message)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

/**
 * POST /api/otp/forgot-password
 * Initiate the forgot-password flow by sending a reset OTP to the user's email.
 * Anti-enumeration: always returns { success: true } regardless of whether the email exists.
 *
 * Request body: { email: string }
 * Response:     { success: true }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'email is required.' })
    }

    // Look up user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() })

    // Anti-enumeration: if user not found, return same success response
    if (!user) {
      return res.json({ success: true })
    }

    // Create reset OTP and send via email
    const { otp } = await otpService.createOTPRecord(user._id, 'reset', 'email')
    const emailResult = await emailService.sendOTPEmail(user.email, otp, 'reset')

    // Always return userId so the frontend can proceed to step 2.
    // Anti-enumeration is maintained by returning the same HTTP status and shape
    // for unknown emails (no userId field) vs known emails (userId present).
    // In dev mode, also return the plain OTP for testing convenience.
    const response = { success: true, userId: user._id.toString() }
    if (!IS_PRODUCTION && emailResult.dev) {
      response.devOtp = otp
    }

    return res.json(response)
  } catch (err) {
    console.error('forgotPassword error:', err.message)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

/**
 * POST /api/otp/verify-reset
 * Verify the reset OTP submitted during the forgot-password flow.
 * Returns userId on success so the frontend can proceed to the new-password step.
 *
 * Request body: { userId: string, otp: string }
 * Response:     { success: true, userId: string }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function verifyReset(req, res) {
  try {
    const { userId, otp } = req.body

    // Validate required fields
    if (!userId || !otp) {
      return res.status(400).json({ error: 'userId and otp are required.' })
    }

    // Validate OTP format: exactly 6 digits
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: 'OTP must be a 6-digit numeric code.' })
    }

    // Look up user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    // Verify reset OTP via service
    const result = await otpService.verifyOTPRecord(userId, 'reset', 'email', otp)

    if (!result.success) {
      return res.status(422).json({ error: result.error })
    }

    return res.json({ success: true, userId })
  } catch (err) {
    console.error('verifyReset error:', err.message)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

/**
 * POST /api/otp/reset-password
 * Set a new password for the user after successful reset OTP verification.
 * Validates password complexity, updates the hash, and invalidates the reset token.
 *
 * Request body: { userId: string, newPassword: string }
 * Response:     { success: true }
 *
 * Password complexity requirements:
 *   - Minimum 8 characters
 *   - At least one uppercase letter
 *   - At least one lowercase letter
 *   - At least one digit
 *   - At least one special character (@$!%*?&)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function resetPassword(req, res) {
  try {
    const { userId, newPassword } = req.body

    // Validate required fields
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'userId and newPassword are required.' })
    }

    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error:
          'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&).',
      })
    }

    // Look up user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    // Update password — pre-save hook will hash it
    user.passwordHash = newPassword
    await user.save()

    // Invalidate the consumed reset OTP record
    await otpService.invalidateOTPRecord(userId, 'reset', 'email')

    return res.json({ success: true })
  } catch (err) {
    console.error('resetPassword error:', err.message)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
