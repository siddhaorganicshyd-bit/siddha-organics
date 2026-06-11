/**
 * Payment Routes — Razorpay
 */
import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { createOrder, verifyPayment } from '../controllers/paymentController.js'

const router = Router()

router.post('/create-order', protect, createOrder)
router.post('/verify', protect, verifyPayment)

export default router
