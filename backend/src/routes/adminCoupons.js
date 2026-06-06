/**
 * Admin Coupon Routes
 * All routes are protected by JWT authentication and restricted to admin role.
 */

import { Router } from 'express'
import { protect, adminOnly } from '../middleware/auth.js'
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js'

const router = Router()

// All admin coupon routes require authentication and admin role
router.use(protect, adminOnly)

router.get('/', listCoupons)
router.post('/', createCoupon)
router.put('/:id', updateCoupon)
router.delete('/:id', deleteCoupon)

export default router
