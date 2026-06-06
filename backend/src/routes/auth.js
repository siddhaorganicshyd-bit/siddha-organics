/**
 * Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/login/admin
 * POST /api/auth/logout
 * GET  /api/auth/me
 */

import { Router } from 'express'
import {
  register,
  login,
  loginAdmin,
  logout,
  getMe,
  verifyOTP,
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/login/admin', loginAdmin)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)
router.post('/verify-otp', verifyOTP)

export default router
