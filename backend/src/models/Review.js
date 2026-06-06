/**
 * Review Model
 * Stores product reviews submitted by authenticated users.
 * productId is stored as a string (matching localStorage-based product IDs).
 * Compound unique index ensures one review per user per product.
 */

import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  body: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true })

const Review = mongoose.model('Review', reviewSchema)
export default Review
