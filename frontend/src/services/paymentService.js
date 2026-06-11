/**
 * Payment Service — Razorpay Integration
 * Handles order creation, checkout popup, and payment verification.
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
 * Load Razorpay script dynamically.
 * @returns {Promise<boolean>}
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Process payment via Razorpay.
 * 1. Creates a Razorpay order on the backend
 * 2. Opens Razorpay checkout popup
 * 3. Verifies payment on backend after success
 *
 * @param {number} amount - Amount in paise (e.g., 50000 for ₹500)
 * @param {object} userInfo - { name, email, phone }
 * @returns {Promise<{ success: boolean, transactionId?: string, error?: string }>}
 */
export async function processPayment(amount, userInfo = {}) {
  // Load Razorpay script
  const loaded = await loadRazorpayScript()
  if (!loaded) {
    return { success: false, transactionId: null, error: 'Failed to load payment gateway. Please try again.' }
  }

  // Step 1: Create order on backend
  try {
    const orderRes = await fetch(`${API_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ amount }),
    })

    if (!orderRes.ok) {
      const err = await orderRes.json().catch(() => ({}))
      return { success: false, transactionId: null, error: err.error || 'Failed to create payment order.' }
    }

    const { order, key_id } = await orderRes.json()

    // Step 2: Open Razorpay checkout popup
    return new Promise((resolve) => {
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'Siddha Organics',
        description: 'Order Payment',
        image: 'https://www.image2url.com/r2/default/images/1780742274635-913a5ef0-80b3-40fa-927c-6b28ce2dc610.png',
        order_id: order.id,
        handler: async function (response) {
          // Step 3: Verify payment on backend
          try {
            const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            if (verifyRes.ok) {
              resolve({
                success: true,
                transactionId: response.razorpay_payment_id,
              })
            } else {
              resolve({
                success: false,
                transactionId: null,
                error: 'Payment verification failed.',
              })
            }
          } catch {
            resolve({
              success: false,
              transactionId: null,
              error: 'Payment verification failed. Please contact support.',
            })
          }
        },
        prefill: {
          name: userInfo.name || '',
          email: userInfo.email || '',
          contact: userInfo.phone || '',
        },
        theme: {
          color: '#2D5016',
        },
        modal: {
          ondismiss: function () {
            resolve({
              success: false,
              transactionId: null,
              error: 'Payment cancelled.',
            })
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        resolve({
          success: false,
          transactionId: null,
          error: response.error.description || 'Payment failed. Please try again.',
        })
      })
      rzp.open()
    })
  } catch (err) {
    return { success: false, transactionId: null, error: 'Network error. Please try again.' }
  }
}

/**
 * Check COD serviceability (mock — always returns true for valid PIN codes).
 * @param {string} pinCode
 * @returns {boolean}
 */
export function checkCodServiceability(pinCode) {
  return /^\d{6}$/.test(pinCode)
}

/**
 * Validates a UPI ID format.
 * @param {string} upiId
 * @returns {boolean}
 */
export function validateUpiId(upiId) {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(upiId)
}

/**
 * Validates card expiry (MM/YY format).
 * @param {string} expiry
 * @returns {boolean}
 */
export function validateCardExpiry(expiry) {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false
  const [mmStr, yyStr] = expiry.split('/')
  const month = parseInt(mmStr, 10)
  const year = parseInt(yyStr, 10) + 2000
  if (month < 1 || month > 12) return false
  const now = new Date()
  if (year < now.getFullYear()) return false
  if (year === now.getFullYear() && month < now.getMonth() + 1) return false
  return true
}

/**
 * Validates card number using Luhn algorithm.
 * @param {string} cardNumber
 * @returns {boolean}
 */
export function validateCardNumber(cardNumber) {
  const digits = cardNumber.replace(/[\s-]/g, '')
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  let shouldDouble = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10)
    if (shouldDouble) { digit *= 2; if (digit > 9) digit -= 9 }
    sum += digit
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}
