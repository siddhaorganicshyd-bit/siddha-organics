const API_URL = import.meta.env.VITE_API_URL || 'https://siddha-organics.onrender.com'

function getAuthHeaders() {
  const token = localStorage.getItem('siddha_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * Validate a coupon code against a given subtotal (in paise).
 * Public endpoint — no auth required.
 *
 * @param {string} code - Coupon code to validate
 * @param {number} subtotal - Order subtotal in paise
 * @returns {Promise<{ success: boolean, data?: { discount: number, discountedTotal: number }, error?: string }>}
 */
export async function validateCoupon(code, subtotal) {
  try {
    const res = await fetch(`${API_URL}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data.error || 'Invalid coupon code.' }
    }
    return { success: true, data }
  } catch {
    return { success: false, error: 'Unable to validate coupon. Please try again.' }
  }
}

/**
 * List all coupons (admin only).
 *
 * @returns {Promise<{ success: boolean, data?: Array, error?: string }>}
 */
export async function listCoupons() {
  try {
    const res = await fetch(`${API_URL}/api/admin/coupons`, {
      headers: getAuthHeaders(),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to fetch coupons.' }
    }
    return { success: true, data }
  } catch {
    return { success: false, error: 'Unable to fetch coupons. Please try again.' }
  }
}

/**
 * Create a new coupon (admin only).
 *
 * @param {{ code: string, type: 'percentage'|'fixed', value: number, minOrderAmount?: number, expiresAt?: string, isActive: boolean }} couponData
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function createCoupon(couponData) {
  try {
    const res = await fetch(`${API_URL}/api/admin/coupons`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(couponData),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to create coupon.' }
    }
    return { success: true, data }
  } catch {
    return { success: false, error: 'Unable to create coupon. Please try again.' }
  }
}

/**
 * Update an existing coupon (admin only).
 *
 * @param {string} id - Coupon document ID
 * @param {Partial<{ code: string, type: string, value: number, minOrderAmount: number, expiresAt: string, isActive: boolean }>} updates
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function updateCoupon(id, updates) {
  try {
    const res = await fetch(`${API_URL}/api/admin/coupons/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update coupon.' }
    }
    return { success: true, data }
  } catch {
    return { success: false, error: 'Unable to update coupon. Please try again.' }
  }
}

/**
 * Delete a coupon (admin only).
 *
 * @param {string} id - Coupon document ID
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function deleteCoupon(id) {
  try {
    const res = await fetch(`${API_URL}/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to delete coupon.' }
    }
    return { success: true, data }
  } catch {
    return { success: false, error: 'Unable to delete coupon. Please try again.' }
  }
}
