import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useOrders } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

const ORDER_STATUSES = ['', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const PAYMENT_METHODS = ['', 'card', 'upi', 'netbanking', 'cod']

export default function OrderManagementPage() {
  const { orders, getAllOrders, loading } = useOrders()

  // Load all orders on mount
  useEffect(() => {
    getAllOrders()
  }, [getAllOrders])

  const [filterStatus, setFilterStatus] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const filtered = useMemo(() => {
    let result = [...orders]

    if (filterStatus) result = result.filter((o) => o.status === filterStatus)
    if (filterPayment) result = result.filter((o) => o.payment.method === filterPayment)
    if (filterDateFrom) {
      const from = new Date(filterDateFrom).getTime()
      result = result.filter((o) => new Date(o.createdAt).getTime() >= from)
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter((o) => new Date(o.createdAt).getTime() <= to.getTime())
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [orders, filterStatus, filterPayment, filterDateFrom, filterDateTo])

  const clearFilters = () => {
    setFilterStatus('')
    setFilterPayment('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-gray-800 mb-6">Orders</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s || 'All Statuses'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment</label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m || 'All Methods'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green"
            />
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">{filtered.length} order{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📦"
          heading="No orders found"
          description="Try adjusting your filters."
          ctaLabel="Clear Filters"
          onCta={clearFilters}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-green">{order.id}</td>
                  <td className="px-4 py-3 text-gray-700">{order.shippingAddress?.fullName || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatINR(order.total)}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{order.payment.method}</td>
                  <td className="px-4 py-3">
                    <Badge variant={order.status}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-xs text-green hover:text-green-dark underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
