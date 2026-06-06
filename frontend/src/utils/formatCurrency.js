/**
 * Formats a paise (integer) value as an INR currency string.
 * @param {number} paise - Amount in paise (1 INR = 100 paise)
 * @returns {string} e.g. "₹450.00"
 */
export function formatINR(paise) {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees)
}
