import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useOrders } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import { addBusinessDays } from '../../utils/dateHelpers'
import { LoadingState } from '../../components/ui/Spinner.jsx'
import Button from '../../components/ui/Button.jsx'

export default function OrderConfirmationPage() {
  const { orderId } = useParams()
  const { getOrder } = useOrders()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrder() {
      try {
        const found = await getOrder(orderId)
        setOrder(found || null)
      } catch {
        setOrder(null)
      }
      setLoading(false)
    }
    loadOrder()
  }, [orderId, getOrder])

  if (loading) return <LoadingState message="Loading order…" />

  if (!order) {
    return (
      <div className="bg-cream min-h-screen flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-2xl font-serif text-green">Order not found</p>
        <Link to="/" className="text-brown underline">Back to Home</Link>
      </div>
    )
  }

  const estimatedDelivery = order.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const getPaymentLabel = () => {
    switch (order.payment.method) {
      case 'card':
        return 'Credit/Debit Card'
      case 'upi':
        return 'UPI'
      case 'netbanking':
        return 'Net Banking'
      case 'razorpay':
        return 'Online Payment (Razorpay)'
      case 'cod':
        return 'Cash on Delivery'
      default:
        return order.payment.method
    }
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <span className="text-4xl text-cream">✓</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-green mb-2">Order Placed!</h1>
          <p className="text-gray-500">
            Thank you for your order. We&apos;ll send you a confirmation shortly.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark p-6 mb-6">
          {/* Order ID */}
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-cream-dark">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
              <p className="font-mono font-bold text-green text-lg">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
              <p className="text-sm font-medium text-green">
                {new Date(order.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-5">
            <h2 className="font-semibold text-green mb-3 text-sm uppercase tracking-wide">Items</h2>
            <div className="flex flex-col gap-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium text-green">{item.productName}</span>
                    {item.variantLabel && (
                      <span className="text-gray-500 ml-1">({item.variantLabel})</span>
                    )}
                    <span className="text-gray-500 ml-2">× {item.quantity}</span>
                  </div>
                  <span className="font-medium text-brown">{formatINR(item.lineTotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-cream-dark pt-4 mb-5">
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST</span>
                <span>{formatINR(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{order.shippingCost === 0 ? 'Free' : formatINR(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-cream-dark pt-2 mt-1">
                <span className="text-green">Total</span>
                <span className="text-brown">{formatINR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border-t border-cream-dark pt-4 mb-5">
            <h2 className="font-semibold text-green mb-2 text-sm uppercase tracking-wide">
              Shipping To
            </h2>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-green">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pinCode}</p>
              <p>{order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="border-t border-cream-dark pt-4 mb-5">
            <h2 className="font-semibold text-green mb-2 text-sm uppercase tracking-wide">
              Payment
            </h2>
            <p className="text-sm text-gray-600">{getPaymentLabel()}</p>
            {order.payment.transactionId && (
              <p className="text-xs text-gray-400 mt-1">
                Transaction ID: {order.payment.transactionId}
              </p>
            )}
          </div>

          {/* Estimated Delivery */}
          {estimatedDelivery && (
            <div className="border-t border-cream-dark pt-4">
              <h2 className="font-semibold text-green mb-2 text-sm uppercase tracking-wide">
                Estimated Delivery
              </h2>
              <p className="text-sm text-gray-600">📦 {estimatedDelivery}</p>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/shop" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              Continue Shopping
            </Button>
          </Link>
          <Link to={`/account/orders/${order.id}`} className="flex-1">
            <Button variant="primary" size="lg" className="w-full">
              View Order
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
