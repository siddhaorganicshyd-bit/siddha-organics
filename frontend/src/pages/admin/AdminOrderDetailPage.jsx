import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useOrders } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

export default function AdminOrderDetailPage() {
  const { orderId } = useParams()
  const { getOrder, updateOrderStatus, cancelOrder } = useOrders()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    async function loadOrder() {
      try {
        const found = await getOrder(orderId)
        setOrder(found || null)
        if (found) setNewStatus(found.status)
      } catch {
        setOrder(null)
      }
      setLoading(false)
    }
    loadOrder()
  }, [orderId, getOrder])

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order.status) return
    setUpdating(true)
    try {
      const updated = await updateOrderStatus(orderId, newStatus, statusNote || undefined)
      setOrder(updated)
      setStatusNote('')
      setSuccessMsg('Status updated successfully.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const updated = await cancelOrder(orderId)
      setOrder(updated)
      setNewStatus('Cancelled')
      setShowCancelModal(false)
      setSuccessMsg('Order cancelled and inventory restored.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <LoadingState message="Loading order…" />

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-xl font-semibold text-gray-700">Order not found</p>
        <Link to="/admin/orders" className="text-green underline">Back to Orders</Link>
      </div>
    )
  }

  const canCancel = !['Cancelled', 'Delivered'].includes(order.status)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin/orders" className="text-sm text-gray-500 hover:text-green mb-2 inline-block">
            ← Back to Orders
          </Link>
          <h1 className="font-serif text-2xl font-bold text-gray-800">Order Details</h1>
        </div>
        {canCancel && (
          <Button variant="outline" size="sm" onClick={() => setShowCancelModal(true)}>
            Cancel Order
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="bg-green/10 border border-green/30 text-green text-sm rounded-lg px-4 py-3 mb-5">
          {successMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-5 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
            <p className="font-mono font-bold text-green text-lg">{order.id}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
          <Badge variant={order.status}>{order.status}</Badge>
        </div>

        {/* Items */}
        <div className="mb-5">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Items</h2>
          <div className="flex flex-col gap-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-800">{item.productName}</span>
                  {item.variantLabel && (
                    <span className="text-gray-500 ml-1">({item.variantLabel})</span>
                  )}
                  <span className="text-gray-500 ml-2">× {item.quantity}</span>
                </div>
                <span className="font-medium">{formatINR(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-100 pt-4 mb-5">
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
            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-1">
              <span>Total</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border-t border-gray-100 pt-4 mb-5">
          <h2 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">
            Shipping Address
          </h2>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pinCode}</p>
            <p>{order.shippingAddress.phone}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="border-t border-gray-100 pt-4 mb-5">
          <h2 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide">
            Payment Details
          </h2>
          <p className="text-sm text-gray-600 capitalize">{order.payment.method}</p>
          <p className="text-sm text-gray-600">
            Status: <span className="font-medium capitalize">{order.payment.status}</span>
          </p>
          {order.payment.transactionId && (
            <p className="text-xs text-gray-400 mt-1">
              Transaction ID: {order.payment.transactionId}
            </p>
          )}
          {order.payment.method !== 'cod' && order.status === 'Cancelled' && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded-lg">
              ⚠️ Refund note: Please process refund for this non-COD order.
            </p>
          )}
        </div>

        {/* Status Update */}
        <div className="border-t border-gray-100 pt-4 mb-5">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
            Update Status
          </h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Dispatched via BlueDart"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStatusUpdate}
              loading={updating}
              disabled={newStatus === order.status}
            >
              Update
            </Button>
          </div>
        </div>

        {/* Status History */}
        <div className="border-t border-gray-100 pt-4">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
            Status History
          </h2>
          <div className="flex flex-col gap-2">
            {order.statusHistory.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">{entry.status}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.timestamp).toLocaleString('en-IN')}
                  </p>
                  {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Order">
        <p className="text-sm text-gray-600 mb-2">
          Are you sure you want to cancel this order?
        </p>
        <p className="text-sm text-gray-600 mb-5">
          Inventory will be restored automatically.
          {order.payment.method !== 'cod' && (
            <span className="text-amber-700"> A refund will need to be processed manually.</span>
          )}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowCancelModal(false)} className="flex-1">
            No, Keep Order
          </Button>
          <Button variant="secondary" onClick={handleCancel} loading={cancelling} className="flex-1">
            Yes, Cancel Order
          </Button>
        </div>
      </Modal>
    </div>
  )
}
