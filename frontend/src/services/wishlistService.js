const API_URL = import.meta.env.VITE_API_URL || 'https://siddha-organics.onrender.com'

function getAuthHeaders() {
  const token = localStorage.getItem('siddha_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * Fetch the current user's wishlist.
 * Returns { productIds: [] } on any error so callers can safely destructure.
 */
export async function getWishlist() {
  try {
    const res = await fetch(`${API_URL}/api/wishlist`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) return { productIds: [] }
    return await res.json()
  } catch {
    return { productIds: [] }
  }
}

/**
 * Add a product to the wishlist.
 * @param {string} productId
 */
export async function addToWishlist(productId) {
  const res = await fetch(`${API_URL}/api/wishlist/${productId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to add to wishlist')
  }
  return res.json()
}

/**
 * Remove a product from the wishlist.
 * @param {string} productId
 */
export async function removeFromWishlist(productId) {
  const res = await fetch(`${API_URL}/api/wishlist/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to remove from wishlist')
  }
  return res.json()
}
