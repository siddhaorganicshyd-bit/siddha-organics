/**
 * Order Routes
 * POST  /api/orders              — place order (user)
 * GET   /api/orders/my           — get current user's orders (user)
 * GET   /api/orders/:id          — get single order (user/admin)
 * GET   /api/orders              — get all orders (admin only)
 * PATCH /api/orders/:id/status   — update order status (admin only)
 * POST  /api/orders/:id/cancel   — cancel order (user/admin)
 */

import { Router } from 'express'
import {
  placeOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/orderController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

router.post('/', protect, placeOrder)
router.get('/my', protect, getMyOrders)
router.get('/:id', protect, getOrder)
router.get('/', protect, adminOnly, getAllOrders)
router.patch('/:id/status', protect, adminOnly, updateOrderStatus)
router.post('/:id/cancel', protect, cancelOrder)

export default router
