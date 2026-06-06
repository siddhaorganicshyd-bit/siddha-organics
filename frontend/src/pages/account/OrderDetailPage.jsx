import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useOrders } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'
import OrderTrackingTimeline from '../../components/ui/OrderTrackingTimeline.jsx'

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const { getOrder, cancelOrder } = useOrders()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

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

  const handleCancelOrder = async () => {
    setCancelling(true)
    try {
      const updated = await cancelOrder(orderId)
      setOrder(updated)
      setShowCancelModal(false)
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <LoadingState message="Loading order…" />

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-xl font-serif text-green">Order not found</p>
        <Link to="/account/orders" className="text-brown underline">Back to Orders</Link>
      </div>
    )
  }

  const canCancel = ['Pending', 'Processing'].includes(order.status)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/account/orders" className="text-sm text-gray-500 hover:text-green mb-2 inline-block">
            ← Back to Orders
          </Link>
          <h1 className="font-serif text-2xl font-bold text-green">Order Details</h1>
        </div>
        {canCancel && (
          <Button variant="outline" size="sm" onClick={() => setShowCancelModal(true)}>
            Cancel Order
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-cream-dark p-6 mb-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-5 pb-4 border-b border-cream-dark">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
            <p className="font-mono font-bold text-green text-lg">{order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
            <Badge variant={order.status}>{order.status}</Badge>
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
            Shipping Address
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
          <p className="text-sm text-gray-600 capitalize">{order.payment.method}</p>
          {order.payment.transactionId && (
            <p className="text-xs text-gray-400 mt-1">
              Transaction ID: {order.payment.transactionId}
            </p>
          )}
        </div>

        {/* Status History */}
        <div className="border-t border-cream-dark pt-4">
          <h2 className="font-semibold text-green mb-3 text-sm uppercase tracking-wide">
            Status History
          </h2>
          <OrderTrackingTimeline
            statusHistory={order.statusHistory}
            currentStatus={order.status}
          />
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Order">
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to cancel this order? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowCancelModal(false)} className="flex-1">
            No, Keep Order
          </Button>
          <Button variant="primary" onClick={handleCancelOrder} loading={cancelling} className="flex-1">
            Yes, Cancel Order
          </Button>
        </div>
      </Modal>
    </div>
  )
}
