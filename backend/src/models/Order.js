/**
 * Order Model
 * Represents a customer order with items, shipping, payment, and status history.
 * All monetary values are in paise (1 INR = 100 paise).
 */

import mongoose from 'mongoose'

// ─── Order item sub-schema ────────────────────────────────────────────────────

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: String,
      required: true,
    },
    productName:  { type: String, required: true },
    variantLabel: { type: String, default: '' },
    image:        { type: String, default: '' },
    priceAtAdd:   { type: Number, required: true, min: 0 }, // price when added to cart (paise)
    quantity:     { type: Number, required: true, min: 1 },
    lineTotal:    { type: Number, required: true, min: 0 }, // priceAtAdd * quantity
  },
  { _id: false }
)

// ─── Shipping address sub-schema ──────────────────────────────────────────────

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    line1:    { type: String, required: true, trim: true },
    line2:    { type: String, trim: true, default: '' },
    city:     { type: String, required: true, trim: true },
    state:    { type: String, required: true, trim: true },
    pinCode:  { type: String, required: true, match: [/^\d{6}$/, 'PIN code must be 6 digits'] },
    phone:    { type: String, required: true, match: [/^\d{10}$/, 'Phone must be 10 digits'] },
  },
  { _id: false }
)

// ─── Payment sub-schema ───────────────────────────────────────────────────────

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      enum: ['card', 'upi', 'netbanking', 'cod'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: { type: String, default: null },
    paidAt:        { type: Date, default: null },
  },
  { _id: false }
)

// ─── Status history sub-schema ────────────────────────────────────────────────

const statusHistorySchema = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    note:      { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
)

// ─── Order schema ─────────────────────────────────────────────────────────────

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    payment: {
      type: paymentSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    subtotal:     { type: Number, required: true, min: 0 },
    tax:          { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    total:        { type: Number, required: true, min: 0 },
    notes:        { type: String, default: '' },
  },
  {
    timestamps: true,
  }
)

// ─── Indexes ──────────────────────────────────────────────────────────────────

orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ status: 1 })
orderSchema.index({ 'payment.method': 1 })
orderSchema.index({ 'payment.status': 1 })
orderSchema.index({ createdAt: -1 })

// ─── Virtual: transaction status ──────────────────────────────────────────────

orderSchema.virtual('transactionStatus').get(function () {
  if (this.status === 'Cancelled' && this.payment.method !== 'cod') return 'refunded'
  if (this.payment.status === 'paid' || this.status === 'Delivered') return 'received'
  return 'pending'
})

// ─── Pre-save: push to statusHistory on status change ────────────────────────

orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status, timestamp: new Date() })
  }
  next()
})

// ─── Transform ────────────────────────────────────────────────────────────────

orderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v
    return ret
  },
})

const Order = mongoose.model('Order', orderSchema)
export default Order
