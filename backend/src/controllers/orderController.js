/**
 * Order Controller
 * Handles order placement, retrieval, status updates, cancellation
 * Uses Mongoose Order and Product models for persistence.
 */

import { Order, Product, User } from '../models/index.js'
import { sendOrderConfirmationEmail } from '../services/emailService.js'

function addBusinessDays(date, days) {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return result
}

// POST /api/orders
export async function placeOrder(req, res) {
  try {
    const { items, shippingAddress, payment, subtotal, tax, shippingCost, total } = req.body

    if (!items?.length || !shippingAddress || !payment) {
      return res.status(400).json({ error: 'Missing required order fields.' })
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return res.status(400).json({ error: 'Each item must have a valid productId.' })
      }
      if (!item.variantId || typeof item.variantId !== 'string') {
        return res.status(400).json({ error: 'Each item must have a valid variantId.' })
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ error: 'Item quantity must be a positive integer.' })
      }
      if (typeof item.priceAtAdd !== 'number' || item.priceAtAdd < 0) {
        return res.status(400).json({ error: 'Item price must be a non-negative number.' })
      }
    }

    // Validate shipping address fields
    const addr = shippingAddress
    if (!addr.fullName?.trim() || !addr.line1?.trim() || !addr.city?.trim() || !addr.state?.trim()) {
      return res.status(400).json({ error: 'Shipping address is incomplete.' })
    }
    if (!/^\d{6}$/.test(addr.pinCode)) {
      return res.status(400).json({ error: 'Shipping PIN code must be exactly 6 digits.' })
    }
    if (!/^\d{10}$/.test(addr.phone)) {
      return res.status(400).json({ error: 'Shipping phone must be exactly 10 digits.' })
    }

    // Validate payment method
    const ALLOWED_METHODS = ['card', 'upi', 'netbanking', 'cod']
    if (!payment.method || !ALLOWED_METHODS.includes(payment.method)) {
      return res.status(400).json({ error: `Payment method must be one of: ${ALLOWED_METHODS.join(', ')}.` })
    }

    // Build order items with product snapshots from DB
    const orderItems = []
    const stockDecrements = []

    for (const item of items) {
      const product = await Product.findById(item.productId)
      const variant = product?.variants?.find((v) => v._id.toString() === item.variantId)

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        productName: product?.name || item.productId,
        variantLabel: variant?.label || item.variantId,
        priceAtAdd: item.priceAtAdd,
        quantity: item.quantity,
        lineTotal: item.priceAtAdd * item.quantity,
      })

      // Prepare stock decrement operation
      stockDecrements.push({
        updateOne: {
          filter: { _id: item.productId, 'variants._id': item.variantId },
          update: {
            $inc: {
              'variants.$.stock': -item.quantity,
              salesCount: item.quantity,
            },
          },
        },
      })
    }

    const now = new Date()
    const estimatedDelivery = addBusinessDays(now, 5).toISOString().split('T')[0]

    const orderDoc = {
      userId: req.user.userId,
      items: orderItems,
      shippingAddress,
      payment: {
        method: payment.method,
        status: payment.transactionId ? 'paid' : 'pending',
        transactionId: payment.transactionId || null,
        paidAt: payment.paidAt || null,
      },
      status: 'Pending',
      statusHistory: [{ status: 'Pending', timestamp: now }],
      subtotal,
      tax,
      shippingCost,
      total,
      estimatedDelivery,
    }

    const order = await Order.create(orderDoc)

    // Decrement stock via bulkWrite
    if (stockDecrements.length > 0) {
      await Product.bulkWrite(stockDecrements)
    }

    // Send order confirmation email (fire-and-forget)
    try {
      const user = await User.findById(req.user.userId)
      if (user?.email) {
        await sendOrderConfirmationEmail(user.email, order)
      }
    } catch (emailErr) {
      console.error('Failed to send order confirmation email:', emailErr.message)
    }

    return res.status(201).json(order)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message)
      return res.status(400).json({ error: messages.join(', ') })
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    console.error('[POST /api/orders]', err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// GET /api/orders/my
export async function getMyOrders(req, res) {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 })
    return res.json(orders)
  } catch (err) {
    console.error('[GET /api/orders/my]', err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// GET /api/orders/:id
export async function getOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found.' })

    // Users can only see their own orders
    if (req.user.role !== 'admin' && order.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    return res.json(order)
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    console.error('[GET /api/orders/:id]', err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// GET /api/orders (admin)
export async function getAllOrders(req, res) {
  try {
    const { status, dateFrom, dateTo, paymentMethod } = req.query
    const filterQuery = {}

    if (status) filterQuery.status = status
    if (dateFrom || dateTo) {
      filterQuery.createdAt = {}
      if (dateFrom) filterQuery.createdAt.$gte = new Date(dateFrom)
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        filterQuery.createdAt.$lte = to
      }
    }
    if (paymentMethod) filterQuery['payment.method'] = paymentMethod

    const orders = await Order.find(filterQuery).sort({ createdAt: -1 })
    return res.json(orders)
  } catch (err) {
    console.error('[GET /api/orders]', err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// PATCH /api/orders/:id/status
export async function updateOrderStatus(req, res) {
  try {
    const { status, note } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found.' })

    const ALLOWED_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}.` })
    }

    // Prevent invalid transitions
    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      return res.status(400).json({ error: `Cannot change status of a ${order.status} order.` })
    }

    if (note && typeof note !== 'string') {
      return res.status(400).json({ error: 'Note must be a string.' })
    }

    const now = new Date()
    const historyEntry = { status, timestamp: now, ...(note ? { note } : {}) }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status, updatedAt: now },
        $push: { statusHistory: historyEntry },
      },
      { new: true }
    )

    return res.json(updated)
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    console.error('[PATCH /api/orders/:id/status]', err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}

// POST /api/orders/:id/cancel
export async function cancelOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found.' })

    if (req.user.role !== 'admin' && order.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    if (['Delivered', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel this order.' })
    }

    // Restore inventory via bulkWrite
    const stockRestores = order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId, 'variants._id': item.variantId },
        update: { $inc: { 'variants.$.stock': item.quantity } },
      },
    }))

    if (stockRestores.length > 0) {
      await Product.bulkWrite(stockRestores)
    }

    const now = new Date()
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: { status: 'Cancelled', updatedAt: now },
        $push: { statusHistory: { status: 'Cancelled', timestamp: now } },
      },
      { new: true }
    )

    return res.json(updated)
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    console.error('[POST /api/orders/:id/cancel]', err.stack)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}
