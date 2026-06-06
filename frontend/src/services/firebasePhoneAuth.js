/**
 * Firebase Phone Authentication Service
 * Handles sending and verifying phone OTPs using Firebase Auth.
 * Falls back to dev mode (console log) if Firebase is not configured.
 */

import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth, isConfigured } from '../config/firebase.js'

// Store confirmation result globally (needed for verifyPhoneOTP)
let confirmationResult = null

/**
 * Initialize the invisible reCAPTCHA verifier.
 * Must be called before sendPhoneOTP.
 * @param {string} buttonId - ID of the submit button element (for invisible reCAPTCHA)
 * @returns {RecaptchaVerifier | null}
 */
export function initRecaptcha(containerId = 'recaptcha-container') {
  if (!isConfigured || !auth) return null

  try {
    // Clear any existing verifier
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear() } catch { /* ignore */ }
      window.recaptchaVerifier = null
    }

    // Also clear the DOM element so Firebase doesn't see a stale widget
    const el = document.getElementById(containerId)
    if (el) el.innerHTML = ''

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        console.warn('reCAPTCHA expired — please try again')
      },
    })

    return window.recaptchaVerifier
  } catch (err) {
    console.error('reCAPTCHA init failed:', err.message)
    return null
  }
}

/**
 * Send OTP to a phone number via Firebase.
 * @param {string} phone - 10-digit Indian number (without +91)
 * @returns {Promise<{ success: boolean, error?: string, dev?: boolean }>}
 */
export async function sendPhoneOTP(phone) {
  if (!isConfigured || !auth) {
    // Dev fallback — generate a fake OTP stored in sessionStorage
    const devOtp = String(Math.floor(100000 + Math.random() * 900000))
    sessionStorage.setItem('dev_phone_otp', devOtp)
    sessionStorage.setItem('dev_phone_otp_expires', String(Date.now() + 10 * 60 * 1000))
    console.info(`📱 [DEV] Phone OTP for +91${phone}: ${devOtp}`)
    return { success: true, dev: true, devOtp }
  }

  try {
    const phoneNumber = `+91${phone}`
    const appVerifier = window.recaptchaVerifier

    if (!appVerifier) {
      return { success: false, error: 'reCAPTCHA not initialized. Please refresh and try again.' }
    }

    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    return { success: true }
  } catch (err) {
    console.error('Firebase phone OTP error:', err.message)

    // Reset reCAPTCHA on error
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear()
      window.recaptchaVerifier = null
    }

    const friendlyErrors = {
      'auth/invalid-phone-number': 'Invalid phone number. Please check and try again.',
      'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
      'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
      'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please refresh and try again.',
    }

    return {
      success: false,
      error: friendlyErrors[err.code] || `Failed to send OTP: ${err.message}`,
    }
  }
}

/**
 * Verify the OTP entered by the user.
 * @param {string} otp - 6-digit code entered by user
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function verifyPhoneOTP(otp) {
  if (!isConfigured || !auth) {
    // Dev fallback
    const devOtp = sessionStorage.getItem('dev_phone_otp')
    const expires = Number(sessionStorage.getItem('dev_phone_otp_expires') || '0')

    if (!devOtp) return { success: false, error: 'OTP expired. Please request a new one.' }
    if (Date.now() > expires) {
      sessionStorage.removeItem('dev_phone_otp')
      return { success: false, error: 'OTP has expired. Please request a new one.' }
    }
    if (otp.trim() !== devOtp) {
      return { success: false, error: 'Incorrect OTP. Please try again.' }
    }

    sessionStorage.removeItem('dev_phone_otp')
    sessionStorage.removeItem('dev_phone_otp_expires')
    return { success: true }
  }

  if (!confirmationResult) {
    return { success: false, error: 'Session expired. Please request a new OTP.' }
  }

  try {
    await confirmationResult.confirm(otp.trim())
    confirmationResult = null
    return { success: true }
  } catch (err) {
    const friendlyErrors = {
      'auth/invalid-verification-code': 'Incorrect OTP. Please try again.',
      'auth/code-expired': 'OTP has expired. Please request a new one.',
      'auth/session-expired': 'Session expired. Please request a new OTP.',
    }
    return {
      success: false,
      error: friendlyErrors[err.code] || 'Verification failed. Please try again.',
    }
  }
}

/**
 * Clear the confirmation result (e.g. on component unmount).
 */
export function clearPhoneSession() {
  confirmationResult = null
  if (window.recaptchaVerifier) {
    try { window.recaptchaVerifier.clear() } catch { /* ignore */ }
    window.recaptchaVerifier = null
  }
}
