/**
 * Sanitizes a string by removing XSS-prone content:
 * - <script>...</script> tags and their content
 * - HTML event handler attributes (onclick, onload, onerror, etc.)
 * - javascript: protocol URLs in href/src attributes
 * Preserves plain text content.
 *
 * @param {string} input - Raw string to sanitize
 * @returns {string} Sanitized string
 */
export function sanitize(input) {
  let result = input

  // Remove <script>...</script> blocks
  result = result.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')

  // Remove HTML event handler attributes (on* = "..." or on* = '...')
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')

  // Remove javascript: protocol in href and src attributes
  result = result.replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi, '')

  return result
}
