/**
 * Review Controller
 * Handles fetching and creating product reviews.
 */

import { Review } from '../models/index.js'

/**
 * GET /api/reviews?productId=:id
 * Returns all reviews for a given product, sorted by createdAt descending.
 * Populates userId with the user's fullName only.
 * Public — no authentication required.
 */
export async function getReviews(req, res) {
  try {
    const { productId } = req.query

    if (!productId) {
      return res.status(400).json({ error: 'productId query parameter is required' })
    }

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName')

    return res.json(reviews)
  } catch (err) {
    console.error('getReviews error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/reviews
 * Creates a new review for a product.
 * Requires authentication (protect middleware).
 * Returns 409 if the user has already reviewed this product.
 * Returns 422 if rating or body validation fails.
 * Returns 201 on success.
 */
export async function createReview(req, res) {
  try {
    const { productId, rating, body } = req.body
    const userId = req.user.userId

    // Validate required fields
    if (!productId) {
      return res.status(422).json({ error: 'productId is required' })
    }

    // Validate rating
    const ratingNum = Number(rating)
    if (!rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5 || !Number.isInteger(ratingNum)) {
      return res.status(422).json({ error: 'rating must be an integer between 1 and 5' })
    }

    // Validate body
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return res.status(422).json({ error: 'body is required and cannot be empty' })
    }

    // Check for duplicate review
    const existing = await Review.findOne({ productId, userId })
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this product' })
    }

    const review = await Review.create({
      productId,
      userId,
      rating: ratingNum,
      body: body.trim(),
    })

    // Populate userId.fullName before returning
    await review.populate('userId', 'fullName')

    return res.status(201).json(review)
  } catch (err) {
    // Handle Mongoose duplicate key error (race condition)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already reviewed this product' })
    }
    console.error('createReview error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
