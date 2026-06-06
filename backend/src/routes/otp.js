/**
 * OTP Routes
 * POST /api/otp/send/email       — send OTP to user's email
 * POST /api/otp/send/phone       — send OTP to user's phone via WhatsApp
 * POST /api/otp/verify/email     — verify email OTP
 * POST /api/otp/verify/phone     — mark phone as verified (Firebase handles client-side)
 * POST /api/otp/forgot-password  — initiate password reset flow
 * POST /api/otp/verify-reset     — verify reset OTP
 * POST /api/otp/reset-password   — set new password after reset OTP verified
 */

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  sendEmailOTP,
  sendPhoneOTP,
  verifyEmailOTP,
  verifyPhoneOTP,
  forgotPassword,
  verifyReset,
  resetPassword,
} from '../controllers/otpController.js'

// 5 requests per 15 minutes per IP for send endpoints
const sendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// 10 requests per 15 minutes per IP for verify endpoints
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many verification attempts. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const router = Router()

router.post('/send/email', sendLimiter, sendEmailOTP)
router.post('/send/phone', sendLimiter, sendPhoneOTP)
router.post('/verify/email', verifyLimiter, verifyEmailOTP)
router.post('/verify/phone', verifyLimiter, verifyPhoneOTP)
router.post('/forgot-password', sendLimiter, forgotPassword)
router.post('/verify-reset', verifyLimiter, verifyReset)
router.post('/reset-password', verifyLimiter, resetPassword)

export default router
