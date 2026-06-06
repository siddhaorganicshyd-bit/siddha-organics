/**
 * Wishlist Routes
 * All routes require authentication via the protect middleware.
 */

import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js'

const router = Router()

// All wishlist routes require authentication
router.use(protect)

router.get('/', getWishlist)
router.post('/:productId', addToWishlist)
router.delete('/:productId', removeFromWishlist)

export default router
