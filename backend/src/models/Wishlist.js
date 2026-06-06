/**
 * Wishlist Model
 * Stores a single wishlist document per authenticated user.
 * productIds are stored as strings (matching localStorage-based product IDs).
 */

import mongoose from 'mongoose'

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  productIds: [
    {
      type: String,
      required: true,
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

const Wishlist = mongoose.model('Wishlist', wishlistSchema)
export default Wishlist
