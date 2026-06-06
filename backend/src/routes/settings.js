/**
 * Settings Routes
 * GET  /api/settings   — get app settings (public)
 * PUT  /api/settings   — update settings (admin only)
 */

import { Router } from 'express'
import { getSettings, updateSettings } from '../controllers/settingsController.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/', getSettings)
router.put('/', protect, adminOnly, updateSettings)

export default router
