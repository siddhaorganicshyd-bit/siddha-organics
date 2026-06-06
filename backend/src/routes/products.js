/**
 * Product Routes
 * GET    /api/products          — list all active products (public)
 * GET    /api/products/:id      — get single product (public)
 * POST   /api/products          — create product (admin only)
 * PUT    /api/products/:id      — update product (admin only)
 * DELETE /api/products/:id      — delete product (admin only)
 * PATCH  /api/products/:id/stock — update variant stock (admin only)
 */

import { Router } from 'express'
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} from '../controllers/productController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

// Public routes
router.get('/', getProducts)
router.get('/:id', getProduct)

// Admin-only routes
router.post('/', protect, adminOnly, createProduct)
router.put('/:id', protect, adminOnly, updateProduct)
router.delete('/:id', protect, adminOnly, deleteProduct)
router.patch('/:id/stock', protect, adminOnly, updateStock)

export default router
