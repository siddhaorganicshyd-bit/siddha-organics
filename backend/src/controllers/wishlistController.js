/**
 * Wishlist Controller
 * Handles get, add, and remove operations for a user's wishlist.
 */

import { Wishlist } from '../models/index.js'

/**
 * GET /api/wishlist
 * Returns the authenticated user's wishlist product IDs.
 */
export async function getWishlist(req, res) {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.userId })
    return res.json({ productIds: wishlist ? wishlist.productIds : [] })
  } catch (err) {
    console.error('getWishlist error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/wishlist/:productId
 * Adds a product to the user's wishlist.
 * Creates the wishlist document if it does not yet exist.
 * Returns 409 if the product is already in the wishlist.
 */
export async function addToWishlist(req, res) {
  try {
    const { productId } = req.params
    const userId = req.user.userId

    // Check if wishlist exists and already contains this product
    const existing = await Wishlist.findOne({ userId })

    if (existing && existing.productIds.includes(productId)) {
      return res.status(409).json({ error: 'Product already in wishlist' })
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      {
        $addToSet: { productIds: productId },
        $set: { updatedAt: new Date() },
      },
      { upsert: true, new: true }
    )

    return res.status(200).json({ productIds: wishlist.productIds })
  } catch (err) {
    console.error('addToWishlist error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * DELETE /api/wishlist/:productId
 * Removes a product from the user's wishlist.
 */
export async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params
    const userId = req.user.userId

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      {
        $pull: { productIds: productId },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    )

    return res.json({ productIds: wishlist ? wishlist.productIds : [] })
  } catch (err) {
    console.error('removeFromWishlist error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
