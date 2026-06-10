/**
 * @fileoverview Order service for Siddha Organics Ecommerce.
 * All order operations go through the backend REST API.
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://siddha-organics.onrender.com'

function getToken() {
  return localStorage.getItem('siddha_token')
}

function authHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * Place a new order.
 * @param {object} payload - Order payload with items, shippingAddress, payment, totals
 * @returns {Promise<object>} The created order
 */
export async function placeOrder(payload) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to place order')
  }
  return res.json()
}

/**
 * Get orders for the authenticated user.
 * @returns {Promise<object[]>}
 */
export async function getUserOrders() {
  const res = await fetch(`${API_URL}/api/orders/my`, {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to fetch orders')
  }
  return res.json()
}

/**
 * Get a single order by ID.
 * @param {string} orderId
 * @returns {Promise<object>}
 */
export async function getOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to fetch order')
  }
  return res.json()
}

/**
 * Get all orders (admin) with optional filters.
 * @param {object} [filters={}] - { status, dateFrom, dateTo, paymentMethod }
 * @returns {Promise<object[]>}
 */
export async function getAllOrders(filters = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  ).toString()
  const url = query ? `${API_URL}/api/orders?${query}` : `${API_URL}/api/orders`
  const res = await fetch(url, {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to fetch orders')
  }
  return res.json()
}

/**
 * Update order status (admin).
 * @param {string} orderId
 * @param {string} status
 * @param {string} [note]
 * @returns {Promise<object>}
 */
export async function updateOrderStatus(orderId, status, note) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status, ...(note ? { note } : {}) }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to update order status')
  }
  return res.json()
}

/**
 * Cancel an order.
 * @param {string} orderId
 * @returns {Promise<object>}
 */
export async function cancelOrder(orderId) {
  const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to cancel order')
  }
  return res.json()
}
