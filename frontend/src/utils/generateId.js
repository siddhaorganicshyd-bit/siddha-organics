/**
 * Generates an order ID in the format SO-YYYYMMDD-NNNN.
 * @param {Date} date
 * @param {number} sequence - 1-based sequence number
 * @returns {string} e.g. "SO-20240115-0001"
 */
export function generateOrderId(date, sequence) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const seq = String(sequence).padStart(4, '0')
  return `SO-${year}${month}${day}-${seq}`
}

/**
 * Generates a UUID v4 string.
 * Uses crypto.randomUUID() if available, otherwise falls back to a manual implementation.
 * @returns {string}
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback: manual UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
