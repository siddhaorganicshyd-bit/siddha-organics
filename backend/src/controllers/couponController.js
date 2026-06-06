/**
 * Coupon Controller
 * Admin CRUD for coupons and public coupon validation at checkout.
 */

import { Coupon } from '../models/index.js'

/**
 * GET /api/admin/coupons
 * Returns all coupons. Admin only.
 */
export async function listCoupons(req, res) {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    return res.json(coupons)
  } catch (err) {
    console.error('listCoupons error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/admin/coupons
 * Creates a new coupon. Admin only.
 * Required fields: code, type, value
 */
export async function createCoupon(req, res) {
  try {
    const { code, type, value, minOrderAmount, expiresAt, isActive } = req.body

    if (!code || !type || value === undefined || value === null) {
      return res.status(400).json({ error: 'code, type, and value are required' })
    }

    // code: alphanumeric + hyphens only, 2–50 chars
    if (typeof code !== 'string' || !/^[A-Z0-9\-]{2,50}$/i.test(code.trim())) {
      return res.status(400).json({ error: 'Coupon code must be 2–50 alphanumeric characters (hyphens allowed).' })
    }

    if (!['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({ error: 'type must be "percentage" or "fixed"' })
    }

    if (typeof value !== 'number' || isNaN(value) || value < 0) {
      return res.status(400).json({ error: 'value must be a non-negative number' })
    }

    // Percentage coupons cannot exceed 100%
    if (type === 'percentage' && value > 100) {
      return res.status(400).json({ error: 'Percentage discount cannot exceed 100%.' })
    }

    if (minOrderAmount !== undefined && minOrderAmount !== null) {
      if (typeof minOrderAmount !== 'number' || isNaN(minOrderAmount) || minOrderAmount < 0) {
        return res.status(400).json({ error: 'minOrderAmount must be a non-negative number.' })
      }
    }

    if (expiresAt !== undefined && expiresAt !== null && expiresAt !== '') {
      const expDate = new Date(expiresAt)
      if (isNaN(expDate.getTime())) {
        return res.status(400).json({ error: 'expiresAt must be a valid date.' })
      }
      if (expDate <= new Date()) {
        return res.status(400).json({ error: 'Expiry date must be in the future.' })
      }
    }

    const coupon = await Coupon.create({
      code,
      type,
      value,
      minOrderAmount: minOrderAmount ?? 0,
      expiresAt: expiresAt ?? null,
      isActive: isActive !== undefined ? isActive : true,
    })

    return res.status(201).json(coupon)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A coupon with this code already exists' })
    }
    console.error('createCoupon error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * PUT /api/admin/coupons/:id
 * Updates a coupon by ID. Admin only.
 */
export async function updateCoupon(req, res) {
  try {
    const { id } = req.params
    const { code, type, value, minOrderAmount, expiresAt, isActive } = req.body
    const updates = {}

    if (code !== undefined) {
      if (typeof code !== 'string' || !/^[A-Z0-9\-]{2,50}$/i.test(code.trim())) {
        return res.status(400).json({ error: 'Coupon code must be 2–50 alphanumeric characters (hyphens allowed).' })
      }
      updates.code = code.trim().toUpperCase()
    }
    if (type !== undefined) {
      if (!['percentage', 'fixed'].includes(type)) {
        return res.status(400).json({ error: 'type must be "percentage" or "fixed"' })
      }
      updates.type = type
    }
    if (value !== undefined) {
      if (typeof value !== 'number' || isNaN(value) || value < 0) {
        return res.status(400).json({ error: 'value must be a non-negative number' })
      }
      const effectiveType = type ?? (await Coupon.findById(id))?.type
      if (effectiveType === 'percentage' && value > 100) {
        return res.status(400).json({ error: 'Percentage discount cannot exceed 100%.' })
      }
      updates.value = value
    }
    if (minOrderAmount !== undefined) {
      if (typeof minOrderAmount !== 'number' || isNaN(minOrderAmount) || minOrderAmount < 0) {
        return res.status(400).json({ error: 'minOrderAmount must be a non-negative number.' })
      }
      updates.minOrderAmount = minOrderAmount
    }
    if (expiresAt !== undefined) {
      if (expiresAt !== null && expiresAt !== '') {
        const expDate = new Date(expiresAt)
        if (isNaN(expDate.getTime())) {
          return res.status(400).json({ error: 'expiresAt must be a valid date.' })
        }
        updates.expiresAt = expDate
      } else {
        updates.expiresAt = null
      }
    }
    if (isActive !== undefined) updates.isActive = Boolean(isActive)

    const coupon = await Coupon.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' })
    }

    return res.json(coupon)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A coupon with this code already exists' })
    }
    console.error('updateCoupon error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * DELETE /api/admin/coupons/:id
 * Deletes a coupon by ID. Admin only.
 */
export async function deleteCoupon(req, res) {
  try {
    const { id } = req.params

    const coupon = await Coupon.findByIdAndDelete(id)

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' })
    }

    return res.json({ message: 'Coupon deleted successfully' })
  } catch (err) {
    console.error('deleteCoupon error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/coupons/validate
 * Public endpoint. Validates a coupon code against a given subtotal (in INR).
 * Body: { code: string, subtotal: number }
 * Returns: { discount, discountedTotal, coupon: { code, type, value } }
 */
export async function validateCoupon(req, res) {
  try {
    const { code, subtotal } = req.body

    if (!code || subtotal === undefined || subtotal === null) {
      return res.status(400).json({ error: 'code and subtotal are required' })
    }

    // Validate code format and length
    if (typeof code !== 'string' || code.trim().length === 0 || code.trim().length > 50) {
      return res.status(400).json({ error: 'Invalid coupon code.' })
    }

    const numericSubtotal = Number(subtotal)
    if (isNaN(numericSubtotal) || !isFinite(numericSubtotal) || numericSubtotal < 0) {
      return res.status(400).json({ error: 'subtotal must be a non-negative finite number' })
    }

    // Case-insensitive lookup via uppercase conversion (schema stores uppercase)
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() })

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ error: 'Coupon not found or is no longer active' })
    }

    // Check expiry
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ error: 'This coupon has expired' })
    }

    // Check minimum order amount
    if (numericSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        error: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
      })
    }

    // Calculate discount
    let discount
    if (coupon.type === 'percentage') {
      discount = numericSubtotal * (coupon.value / 100)
    } else {
      // fixed — discount cannot exceed the subtotal
      discount = Math.min(coupon.value, numericSubtotal)
    }

    const discountedTotal = numericSubtotal - discount

    return res.json({
      discount,
      discountedTotal,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
    })
  } catch (err) {
    console.error('validateCoupon error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
