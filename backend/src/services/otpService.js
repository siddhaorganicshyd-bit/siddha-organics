/**
 * OTP Service
 * Core business logic for OTP lifecycle management.
 * Handles generation, storage (as bcrypt hashes), verification, and invalidation.
 * No HTTP concerns — pure service layer.
 */

import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { OtpRecord } from '../models/index.js'

/**
 * Generates a cryptographically random 6-digit numeric OTP string.
 * Uses crypto.randomInt to ensure values are in the range [100000, 999999].
 *
 * @returns {string} A 6-digit numeric string (e.g. "482031")
 */
export function generateOTP() {
  const num = crypto.randomInt(100000, 1000000)
  return String(num).padStart(6, '0')
}

/**
 * Creates (or replaces) an OTP record for the given userId/type/channel slot.
 * The plain OTP is hashed with bcrypt before storage — it is never persisted in plain text.
 * If a record already exists for the same slot, it is atomically replaced (upsert).
 *
 * @param {string} userId  - MongoDB ObjectId of the user
 * @param {string} type    - OTP type: 'verification' or 'reset'
 * @param {string} channel - Delivery channel: 'email' or 'phone'
 * @returns {Promise<{ otp: string, record: import('../models/OtpRecord.js').default }>}
 *   otp    — the plain-text OTP (for sending via email/SMS; never store this)
 *   record — the saved OtpRecord document
 */
export async function createOTPRecord(userId, type, channel) {
  const otp = generateOTP()
  const otpHash = await bcrypt.hash(otp, 10)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  const record = await OtpRecord.findOneAndUpdate(
    { userId, type, channel },
    {
      $set: {
        otpHash,
        expiresAt,
        attempts: 0,
        consumed: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return { otp, record }
}

/**
 * Verifies a submitted OTP against the stored bcrypt hash for the given slot.
 * Enforces expiry, attempt limits, and single-use (consumed) constraints.
 *
 * @param {string} userId  - MongoDB ObjectId of the user
 * @param {string} type    - OTP type: 'verification' or 'reset'
 * @param {string} channel - Delivery channel: 'email' or 'phone'
 * @param {string} otp     - The plain-text OTP submitted by the user
 * @returns {Promise<
 *   { success: true } |
 *   { success: false, error: string, code: 'NOT_FOUND' | 'LOCKED' | 'EXPIRED' | 'WRONG_OTP' }
 * >}
 */
export async function verifyOTPRecord(userId, type, channel, otp) {
  const record = await OtpRecord.findOne({ userId, type, channel })

  // No record found
  if (!record) {
    return {
      success: false,
      error: 'OTP not found. Please request a new one.',
      code: 'NOT_FOUND',
    }
  }

  // Record already consumed
  if (record.consumed) {
    return {
      success: false,
      error: 'OTP not found. Please request a new one.',
      code: 'NOT_FOUND',
    }
  }

  // Too many failed attempts (locked before this attempt)
  if (record.attempts >= 3) {
    return {
      success: false,
      error: 'Too many incorrect attempts. Please request a new OTP.',
      code: 'LOCKED',
    }
  }

  // OTP has expired
  if (record.expiresAt < new Date()) {
    await OtpRecord.deleteOne({ userId, type, channel })
    return {
      success: false,
      error: 'OTP has expired. Please request a new one.',
      code: 'EXPIRED',
    }
  }

  // Compare submitted OTP against stored hash
  const isMatch = await bcrypt.compare(otp, record.otpHash)

  if (!isMatch) {
    record.attempts += 1
    await record.save()

    // If attempts have now reached 3, delete the record and return LOCKED
    if (record.attempts >= 3) {
      await OtpRecord.deleteOne({ userId, type, channel })
      return {
        success: false,
        error: 'Too many incorrect attempts. Please request a new OTP.',
        code: 'LOCKED',
      }
    }

    return {
      success: false,
      error: 'Incorrect OTP. Please try again.',
      code: 'WRONG_OTP',
    }
  }

  // OTP is correct — mark as consumed
  record.consumed = true
  await record.save()

  return { success: true }
}

/**
 * Deletes the OTP record for the given userId/type/channel slot.
 * Used to explicitly invalidate a record (e.g. after password reset completes).
 *
 * @param {string} userId  - MongoDB ObjectId of the user
 * @param {string} type    - OTP type: 'verification' or 'reset'
 * @param {string} channel - Delivery channel: 'email' or 'phone'
 * @returns {Promise<void>}
 */
export async function invalidateOTPRecord(userId, type, channel) {
  await OtpRecord.deleteOne({ userId, type, channel })
}
