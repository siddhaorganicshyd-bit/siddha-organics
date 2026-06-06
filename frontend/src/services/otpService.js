/**
 * Frontend OTP Service
 * Thin fetch wrappers for all OTP-related backend endpoints.
 * All functions return { success, ...data } on success or { success: false, error } on failure.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a fetch Response into a result object.
 * On HTTP error, extracts the `error` field from the JSON body if available.
 * @param {Response} res
 * @returns {Promise<{ success: boolean, [key: string]: unknown }>}
 */
async function parseResponse(res) {
  let data
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  if (!res.ok) {
    return { success: false, error: data.error || `Request failed (${res.status})` }
  }

  return { success: true, ...data }
}

// ─── OTP Send Endpoints ───────────────────────────────────────────────────────

/**
 * Request an email OTP for the given user.
 * @param {string} userId - MongoDB _id of the user
 * @param {'verification' | 'reset'} type - OTP purpose
 * @returns {Promise<{ success: boolean, dev?: boolean, devOtp?: string, error?: string }>}
 */
export async function sendEmailOTP(userId, type) {
  try {
    const res = await fetch(`${API_URL}/api/otp/send/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    })
    return parseResponse(res)
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Request a phone OTP for the given user (delivered via WhatsApp or dev mode).
 * @param {string} userId - MongoDB _id of the user
 * @returns {Promise<{ success: boolean, channel?: string, dev?: boolean, error?: string }>}
 */
export async function sendPhoneOTP(userId) {
  try {
    const res = await fetch(`${API_URL}/api/otp/send/phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    return parseResponse(res)
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

// ─── OTP Verify Endpoints ─────────────────────────────────────────────────────

/**
 * Verify an email OTP submitted by the user.
 * @param {string} userId - MongoDB _id of the user
 * @param {string} otp - 6-digit OTP entered by the user
 * @param {'verification' | 'reset'} type - OTP purpose
 * @returns {Promise<{ success: boolean, bothVerified?: boolean, user?: object, token?: string, error?: string }>}
 */
export async function verifyEmailOTP(userId, otp, type) {
  try {
    const res = await fetch(`${API_URL}/api/otp/verify/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otp, type }),
    })
    return parseResponse(res)
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Notify the backend that phone verification succeeded (Firebase verified client-side).
 * @param {string} userId - MongoDB _id of the user
 * @returns {Promise<{ success: boolean, bothVerified?: boolean, user?: object, token?: string, error?: string }>}
 */
export async function verifyPhoneOTP(userId) {
  try {
    const res = await fetch(`${API_URL}/api/otp/verify/phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    return parseResponse(res)
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

// ─── Forgot Password Endpoints ────────────────────────────────────────────────

/**
 * Initiate the forgot-password flow by submitting the user's email.
 * Always returns a success-shaped response to prevent account enumeration.
 * @param {string} email - email address submitted by the user
 * @returns {Promise<{ success: boolean, userId?: string, error?: string }>}
 */
export async function forgotPassword(email) {
  try {
    const res = await fetch(`${API_URL}/api/otp/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return parseResponse(res)
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Verify the reset OTP submitted by the user.
 * @param {string} userId - MongoDB _id of the user (returned by forgotPassword in dev mode)
 * @param {string} otp - 6-digit reset OTP entered by the user
 * @returns {Promise<{ success: boolean, userId?: string, error?: string }>}
 */
export async function verifyReset(userId, otp) {
  try {
    const res = await fetch(`${API_URL}/api/otp/verify-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otp }),
    })
    return parseResponse(res)
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Set a new password after successful reset OTP verification.
 * @param {string} userId - MongoDB _id of the user
 * @param {string} newPassword - new password (must meet complexity requirements)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function resetPassword(userId, newPassword) {
  try {
    const res = await fetch(`${API_URL}/api/otp/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword }),
    })
    return parseResponse(res)
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}
