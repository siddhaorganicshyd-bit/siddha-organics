/**
 * @fileoverview Payment service for Siddha Organics Ecommerce.
 * Handles payment validation and processing simulation.
 * All payment processing is mocked — no real payment gateway is used.
 *
 * SECURITY NOTE: Raw card numbers and CVV values are NEVER stored or returned
 * in any result object from this service.
 */

// ─── Validation helpers ───────────────────────────────────────────────────────

/**
 * Validates a UPI ID against the pattern `localpart@provider`.
 * Accepted characters in localpart: letters, digits, dots, underscores, hyphens.
 * Provider must be letters only.
 *
 * @param {string} upiId
 * @returns {boolean}
 */
export function validateUpiId(upiId) {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(upiId);
}

/**
 * Validates a card expiry string in MM/YY format.
 * Returns false if the format is wrong or the date is in the past.
 *
 * @param {string} expiry - e.g. "12/26"
 * @returns {boolean}
 */
export function validateCardExpiry(expiry) {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;

  const [mmStr, yyStr] = expiry.split('/');
  const month = parseInt(mmStr, 10);
  const year = parseInt(yyStr, 10) + 2000;

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

/**
 * Validates a card number using the Luhn algorithm.
 * Strips spaces and dashes before checking.
 * Accepts card numbers with 13–19 digits.
 *
 * @param {string} cardNumber
 * @returns {boolean}
 */
export function validateCardNumber(cardNumber) {
  // Strip spaces and dashes
  const digits = cardNumber.replace(/[\s-]/g, '');

  // Must be 13–19 numeric digits
  if (!/^\d{13,19}$/.test(digits)) return false;

  // Standard Luhn algorithm
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Checks whether COD (Cash on Delivery) is serviceable for the given PIN code.
 * Mock implementation: returns true for any valid 6-digit numeric PIN code.
 *
 * @param {string} pinCode
 * @returns {boolean}
 */
export function checkCodServiceability(pinCode) {
  return /^\d{6}$/.test(pinCode);
}

// ─── Payment processing ───────────────────────────────────────────────────────

/**
 * Generates a unique transaction ID.
 * Format: `TXN-{timestamp}-{random4digits}`
 *
 * @returns {string}
 */
function generateTransactionId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 9000) + 1000; // 1000–9999
  return `TXN-${timestamp}-${random}`;
}

/**
 * Simulates payment processing with a ~1500ms delay.
 * Succeeds with 90% probability.
 *
 * SECURITY: Raw card numbers and CVV values from `details` are NEVER included
 * in the returned result object.
 *
 * @param {'card' | 'upi' | 'netbanking' | 'cod'} method - Payment method
 * @param {Object} details - Payment details (card info, UPI ID, etc.)
 * @param {string} [details.cardNumber] - Card number (used for validation only, never returned)
 * @param {string} [details.cvv] - CVV (used for validation only, never returned)
 * @param {string} [details.cardName] - Cardholder name
 * @param {string} [details.expiry] - Card expiry in MM/YY format
 * @param {string} [details.upiId] - UPI ID
 * @param {string} [details.bank] - Bank name for net banking
 * @returns {Promise<{ success: boolean, transactionId: string | null, error?: string }>}
 */
export function processPayment(method, details) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const isSuccess = Math.random() < 0.9; // 90% success rate

      if (isSuccess) {
        // SECURITY: Only return transactionId — never cardNumber or CVV
        resolve({
          success: true,
          transactionId: generateTransactionId(),
        });
      } else {
        resolve({
          success: false,
          transactionId: null,
          error: 'Payment declined. Please try again.',
        });
      }
    }, 1500);
  });
}
