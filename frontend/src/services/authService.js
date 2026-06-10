/**
 * Auth Service
 * Handles OTP generation/verification (localStorage) and email sending (backend API).
 * User registration/login/session is now handled by AuthContext via the backend API.
 */

import { generateOTP } from '../utils/validators'

const API_URL = import.meta.env.VITE_API_URL || 'https://siddha-organics.onrender.com'
const OTP_STORE_KEY = 'siddha_otp_store'

// ─── OTP store helpers (localStorage) ────────────────────────────────────────

function saveOTP(userId, type, otp) {
  try {
    const raw = localStorage.getItem(OTP_STORE_KEY)
    const store = raw ? JSON.parse(raw) : {}
    store[`${userId}_${type}`] = {
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
      attempts: 0,
    }
    localStorage.setItem(OTP_STORE_KEY, JSON.stringify(store))
  } catch { /* ignore */ }
}

function getOTPRecord(userId, type) {
  try {
    const raw = localStorage.getItem(OTP_STORE_KEY)
    if (!raw) return null
    const store = JSON.parse(raw)
    return store[`${userId}_${type}`] || null
  } catch { return null }
}

function clearOTP(userId, type) {
  try {
    const raw = localStorage.getItem(OTP_STORE_KEY)
    if (!raw) return
    const store = JSON.parse(raw)
    delete store[`${userId}_${type}`]
    localStorage.setItem(OTP_STORE_KEY, JSON.stringify(store))
  } catch { /* ignore */ }
}

// ─── Email OTP ────────────────────────────────────────────────────────────────

/**
 * Generate an OTP, store it locally, and send it to the user's email via backend.
 * @param {string} userId - MongoDB _id of the user
 * @param {string} email - user's email address
 * @returns {string} the generated OTP (for dev mode display only)
 */
export function sendEmailOTP(userId, email) {
  const otp = generateOTP()
  saveOTP(userId, 'email', otp)

  if (email) {
    fetch(`${API_URL}/api/otp/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, type: 'verification' }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.dev) console.info(`📧 [DEV] Email OTP for ${email}: ${otp}`)
        else console.info(`📧 Email OTP sent to ${email}`)
      })
      .catch(() => {
        console.info(`📧 [DEV FALLBACK] Email OTP for ${email}: ${otp}`)
      })
  }

  // Only return OTP for dev display if backend is in dev mode (no real email configured)
  // The component will check the backend response to decide whether to show the banner
  return otp
}

/**
 * Generate an OTP, store it locally, and send it to the user's phone via backend SMS.
 * @param {string} userId - MongoDB _id of the user
 * @param {string} phone - 10-digit phone number
 * @returns {Promise<{ otp: string, dev?: boolean, devOtp?: string }>}
 */
export async function sendPhoneOTP(userId, phone) {
  const otp = generateOTP()
  saveOTP(userId, 'phone', otp)

  try {
    const res = await fetch(`${API_URL}/api/otp/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    })
    const data = await res.json()
    if (data.dev) {
      console.info(`📱 [DEV] Phone OTP for ${phone}: ${otp}`)
      return { otp, dev: true, devOtp: data.devOtp || otp }
    }
    return { otp }
  } catch {
    console.info(`📱 [DEV FALLBACK] Phone OTP for ${phone}: ${otp}`)
    return { otp, dev: true, devOtp: otp }
  }
}

/**
 * Verify an OTP for the given userId and type ('email').
 * @returns {{ success: boolean, error?: string }}
 */
export function verifyOTP(userId, type, enteredOtp) {
  const record = getOTPRecord(userId, type)
  if (!record) return { success: false, error: 'OTP expired or not found. Please request a new one.' }
  if (new Date(record.expiresAt) < new Date()) {
    clearOTP(userId, type)
    return { success: false, error: 'OTP has expired. Please request a new one.' }
  }
  if (record.attempts >= 3) {
    clearOTP(userId, type)
    return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' }
  }

  if (record.otp !== enteredOtp.trim()) {
    try {
      const raw = localStorage.getItem(OTP_STORE_KEY)
      const store = raw ? JSON.parse(raw) : {}
      const key = `${userId}_${type}`
      if (store[key]) {
        store[key].attempts = (store[key].attempts || 0) + 1
        localStorage.setItem(OTP_STORE_KEY, JSON.stringify(store))
      }
    } catch { /* ignore */ }
    return { success: false, error: 'Incorrect OTP. Please try again.' }
  }

  clearOTP(userId, type)
  return { success: true }
}

/**
 * Notify the backend that email or phone has been verified.
 * This updates the user's status in MongoDB.
 * @param {string} userId
 * @param {'email' | 'phone'} type
 * @returns {Promise<{ success: boolean, user?: object, error?: string }>}
 */
export async function notifyVerified(userId, type) {
  try {
    const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error }
    return { success: true, user: data.user }
  } catch {
    return { success: false, error: 'Network error.' }
  }
}

// ─── Password reset OTP ───────────────────────────────────────────────────────

/**
 * Send a password reset OTP to the user's email.
 */
export async function forgotPassword(email) {
  try {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    return data
  } catch {
    return { success: false, error: 'Network error.' }
  }
}
