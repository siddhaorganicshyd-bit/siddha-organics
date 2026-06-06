/**
 * User Model
 * Represents both regular customers and admin users.
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// ─── Address sub-schema ───────────────────────────────────────────────────────

const addressSchema = new mongoose.Schema(
  {
    fullName:  { type: String, required: true, trim: true },
    line1:     { type: String, required: true, trim: true },
    line2:     { type: String, trim: true, default: '' },
    city:      { type: String, required: true, trim: true },
    state:     { type: String, required: true, trim: true },
    pinCode:   { type: String, required: true, match: [/^\d{6}$/, 'PIN code must be 6 digits'] },
    phone:     { type: String, required: true, match: [/^\d{10}$/, 'Phone must be 10 digits'] },
  },
  { _id: true }
)

// ─── User schema ──────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\d{10}$/, 'Phone must be exactly 10 digits'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending_verification'],
      default: 'pending_verification',
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    addresses: [addressSchema],
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
)

// ─── Indexes ──────────────────────────────────────────────────────────────────

userSchema.index({ phone: 1 })
userSchema.index({ role: 1, status: 1 })

// ─── Instance methods ─────────────────────────────────────────────────────────

/**
 * Compare a plain-text password against the stored hash.
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

/**
 * Returns true if the account is currently locked.
 * @returns {boolean}
 */
userSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date()
}

// ─── Pre-save hook: hash password if modified ─────────────────────────────────

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  // Only hash if it looks like a plain-text password (not already hashed)
  if (!this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  }
  next()
})

// ─── Transform: remove sensitive fields from JSON output ─────────────────────

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash
    delete ret.__v
    return ret
  },
})

const User = mongoose.model('User', userSchema)
export default User
