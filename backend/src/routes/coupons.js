/**
 * Public Coupon Routes
 * Exposes the coupon validation endpoint for use at checkout.
 */

import { Router } from 'express'
import { validateCoupon } from '../controllers/couponController.js'

const router = Router()

// POST /api/coupons/validate — public, no auth required
router.post('/validate', validateCoupon)

export default router
