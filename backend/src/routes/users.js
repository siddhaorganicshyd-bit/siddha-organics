/**
 * User Routes
 * GET    /api/users              — list all users (admin only)
 * GET    /api/users/:id          — get user (admin only)
 * PATCH  /api/users/:id/suspend  — suspend user (admin only)
 * PATCH  /api/users/:id/reactivate — reactivate user (admin only)
 * DELETE /api/users/:id          — delete user (admin only)
 * PUT    /api/users/me           — update own profile (user)
 */

import { Router } from 'express'
import {
  getAllUsers,
  getUser,
  suspendUser,
  reactivateUser,
  deleteUser,
  updateProfile,
} from '../controllers/userController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, adminOnly, getAllUsers)
router.put('/me', protect, updateProfile)
router.get('/:id', protect, adminOnly, getUser)
router.patch('/:id/suspend', protect, adminOnly, suspendUser)
router.patch('/:id/reactivate', protect, adminOnly, reactivateUser)
router.delete('/:id', protect, adminOnly, deleteUser)

export default router
