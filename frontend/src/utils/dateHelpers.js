/**
 * Adds N business days (Mon–Fri) to a date, skipping weekends.
 * @param {Date} date - Starting date
 * @param {number} days - Number of business days to add
 * @returns {Date}
 */
export function addBusinessDays(date, days) {
  const result = new Date(date)
  let remaining = days
  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay() // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) remaining--
  }
  return result
}

/**
 * Returns true if the given ISO 8601 string is in the past.
 * @param {string} isoString
 * @returns {boolean}
 */
export function isExpired(isoString) {
  return new Date(isoString).getTime() < Date.now()
}
