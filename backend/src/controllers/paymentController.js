/**
 * Payment Controller — Razorpay Integration
 * Creates orders and verifies payments via Razorpay API.
 */

import Razorpay from 'razorpay'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Validate Razorpay credentials at startup
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️  RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from environment variables. Payments will fail.')
}

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order for the given amount.
 * Body: { amount: number (in paise), currency?: string }
 */
export async function createOrder(req, res) {
  try {
    const { amount, currency = 'INR' } = req.body

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Amount must be at least ₹1 (100 paise).' })
    }

    const options = {
      amount: Math.round(Number(amount)), // amount in paise, must be integer
      currency,
      receipt: `order_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    return res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key_id: process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error('Razorpay create order error:', err.message || err)
    return res.status(500).json({ error: err.error?.description || 'Failed to create payment order.' })
  }
}

/**
 * POST /api/payment/verify
 * Verifies the Razorpay payment signature after checkout.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields.' })
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' })
    }

    return res.json({
      success: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    })
  } catch (err) {
    console.error('Razorpay verify error:', err.message)
    return res.status(500).json({ error: 'Payment verification failed.' })
  }
}
