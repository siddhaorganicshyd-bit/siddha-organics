const API_URL = import.meta.env.VITE_API_URL || 'https://siddha-organics.onrender.com'

function getAuthHeaders() {
  const token = localStorage.getItem('siddha_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * Fetch all reviews for a product (public — no auth required).
 * @param {string} productId
 * @returns {{ success: boolean, data?: Array, error?: string }}
 */
export async function getReviews(productId) {
  try {
    const res = await fetch(`${API_URL}/api/reviews?productId=${productId}`)
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'Failed to load reviews' }
    return { success: true, data }
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Submit a new review for a product (requires authentication).
 * @param {string} productId
 * @param {number} rating  — integer 1–5
 * @param {string} body    — review text
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function createReview(productId, rating, body) {
  try {
    const res = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, rating, body }),
    })
    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'Failed to submit review' }
    return { success: true, data }
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}
