/**
 * @fileoverview Product service for Siddha Organics Ecommerce.
 * All product operations go through the backend REST API.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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
 * Fetch products with optional query parameters.
 * @param {Record<string, string>} [params={}]
 * @returns {Promise<import('../types/index').Product[]>}
 */
export async function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query ? `${API_URL}/api/products?${query}` : `${API_URL}/api/products`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to fetch products')
  }
  return res.json()
}

/**
 * Fetch a single product by ID or slug.
 * @param {string} id
 * @returns {Promise<import('../types/index').Product>}
 */
export async function getProduct(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to fetch product')
  }
  return res.json()
}

/**
 * Create a new product (admin).
 * @param {object} payload
 * @returns {Promise<import('../types/index').Product>}
 */
export async function createProduct(payload) {
  const res = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to create product')
  }
  return res.json()
}

/**
 * Update an existing product (admin).
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<import('../types/index').Product>}
 */
export async function updateProduct(id, payload) {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to update product')
  }
  return res.json()
}

/**
 * Delete a product (admin).
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteProduct(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to delete product')
  }
}

/**
 * Update stock for a specific variant of a product (admin).
 * @param {string} productId
 * @param {string} variantId
 * @param {number} stock
 * @returns {Promise<import('../types/index').Product>}
 */
export async function updateStock(productId, variantId, stock) {
  const res = await fetch(`${API_URL}/api/products/${productId}/stock`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ variantId, stock }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to update stock')
  }
  return res.json()
}

/**
 * Search products by query string.
 * @param {string} query
 * @returns {Promise<import('../types/index').Product[]>}
 */
export async function searchProducts(query) {
  return getProducts({ search: query })
}
