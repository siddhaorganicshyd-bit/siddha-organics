/**
 * Settings Model
 * Stores global store configuration. Only one document should exist (singleton).
 * Monetary values (shippingCost, freeShippingThreshold) are in paise.
 */

import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    taxRate: {
      type: Number,
      required: true,
      min: [0, 'Tax rate cannot be negative'],
      max: [1, 'Tax rate must be a decimal between 0 and 1 (e.g. 0.18 for 18%)'],
      default: 0.18,
    },
    shippingCost: {
      type: Number,
      required: true,
      min: [0, 'Shipping cost cannot be negative'],
      default: 5000, // ₹50 in paise
    },
    freeShippingThreshold: {
      type: Number,
      required: true,
      min: [0, 'Free shipping threshold cannot be negative'],
      default: 50000, // ₹500 in paise
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      min: [0, 'Low stock threshold cannot be negative'],
      default: 10,
    },
    storeName: {
      type: String,
      default: 'Siddha Organics',
      trim: true,
    },
    storeEmail: {
      type: String,
      default: 'admin@siddhaorganics.com',
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    storePhone: {
      type: String,
      default: '9876543210',
      trim: true,
      match: [/^\d{10}$/, 'Store phone must be exactly 10 digits'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// ─── Static: get or create singleton settings ─────────────────────────────────

settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({})
  }
  return settings
}

// ─── Transform ────────────────────────────────────────────────────────────────

settingsSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v
    return ret
  },
})

const Settings = mongoose.model('Settings', settingsSchema)
export default Settings
