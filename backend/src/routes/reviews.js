/**
 * Review Routes
 * GET / is public (no auth required).
 * POST / requires authentication via the protect middleware.
 */

import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { getReviews, createReview } from '../controllers/reviewController.js'

const router = Router()

router.get('/', getReviews)
router.post('/', protect, createReview)

export default router
