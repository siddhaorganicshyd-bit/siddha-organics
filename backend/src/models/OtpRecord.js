/**
 * OtpRecord Model
 * Stores hashed OTP records for email/phone verification and password reset flows.
 * Plain-text OTP values are NEVER persisted — only bcrypt hashes.
 */

import mongoose from 'mongoose'

const otpRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['verification', 'reset'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['email', 'phone'],
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3,
    },
    consumed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Compound unique index: one active record per userId/type/channel slot.
// Enables atomic upsert (resend replaces previous OTP) without duplicates.
otpRecordSchema.index(
  { userId: 1, type: 1, channel: 1 },
  { unique: true }
)

// TTL index: MongoDB automatically removes expired documents.
// expireAfterSeconds: 0 means documents are deleted at their expiresAt time.
otpRecordSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
)

const OtpRecord = mongoose.model('OtpRecord', otpRecordSchema)
export default OtpRecord
