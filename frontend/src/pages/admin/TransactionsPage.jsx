import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useOrders } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive a transaction record from an order.
 * - Received  : payment.status === 'paid' (non-COD delivered or online paid)
 * - Pending   : COD not yet delivered, or payment pending
 * - Refunded  : order cancelled + non-COD
 */
function deriveTransaction(order) {
  const method = order.payment?.method || 'unknown'
  const paymentStatus = order.payment?.status || 'pending'
  const orderStatus = order.status

  let txStatus
  if (orderStatus === 'Cancelled' && method !== 'cod') {
    txStatus = 'refunded'
  } else if (paymentStatus === 'paid' || orderStatus === 'Delivered') {
    txStatus = 'received'
  } else {
    txStatus = 'pending'
  }

  return {
    orderId: order.id,
    customer: order.shippingAddress?.fullName || '—',
    date: order.createdAt,
    amount: order.total,
    method,
    orderStatus,
    txStatus,
    transactionId: order.payment?.transactionId || null,
    paidAt: order.payment?.paidAt || null,
  }
}

const METHOD_LABELS = {
  card: '💳 Card',
  upi: '📱 UPI',
  netbanking: '🏦 Net Banking',
  cod: '💵 COD',
  unknown: '—',
}

const STATUS_CONFIG = {
  received: { label: 'Received', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: '✅' },
  pending:  { label: 'Pending',  bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400',   icon: '⏳' },
  refunded: { label: 'Refunded', bg: 'bg-red-100',     text: 'text-red-600',     dot: 'bg-red-400',     icon: '↩️' },
}

const TABS = ['all', 'received', 'pending', 'refunded']

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const { orders, getAllOrders } = useOrders()

  // Load all orders on mount
  useEffect(() => {
    getAllOrders()
  }, [getAllOrders])

  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')

  // Derive all transactions from orders
  const allTransactions = useMemo(
    () => orders.map(deriveTransaction),
    [orders]
  )

  // Summary stats
  const stats = useMemo(() => {
    const received = allTransactions.filter((t) => t.txStatus === 'received')
    const pending  = allTransactions.filter((t) => t.txStatus === 'pending')
    const refunded = allTransactions.filter((t) => t.txStatus === 'refunded')
    return {
      totalRevenue:   received.reduce((s, t) => s + t.amount, 0),
      receivedCount:  received.length,
      pendingAmount:  pending.reduce((s, t) => s + t.amount, 0),
      pendingCount:   pending.length,
      refundedAmount: refunded.reduce((s, t) => s + t.amount, 0),
      refundedCount:  refunded.length,
      totalCount:     allTransactions.length,
    }
  }, [allTransactions])

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let result = [...allTransactions]

    if (activeTab !== 'all') result = result.filter((t) => t.txStatus === activeTab)
    if (filterMethod) result = result.filter((t) => t.method === filterMethod)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.orderId.toLowerCase().includes(q) ||
          t.customer.toLowerCase().includes(q) ||
          (t.transactionId || '').toLowerCase().includes(q)
      )
    }
    if (filterDateFrom) {
      const from = new Date(filterDateFrom).getTime()
      result = result.filter((t) => new Date(t.date).getTime() >= from)
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo)
      to.setHours(23, 59, 59, 999)
      result = result.filter((t) => new Date(t.date).getTime() <= to.getTime())
    }

    switch (sortBy) {
      case 'date-desc': return result.sort((a, b) => new Date(b.date) - new Date(a.date))
      case 'date-asc':  return result.sort((a, b) => new Date(a.date) - new Date(b.date))
      case 'amount-desc': return result.sort((a, b) => b.amount - a.amount)
      case 'amount-asc':  return result.sort((a, b) => a.amount - b.amount)
      default: return result
    }
  }, [allTransactions, activeTab, filterMethod, searchQuery, filterDateFrom, filterDateTo, sortBy])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterMethod('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setSortBy('date-desc')
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-800">Transactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">All payment activity across your store</p>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          {
            label: 'Total Revenue',
            value: formatINR(stats.totalRevenue),
            sub: `${stats.receivedCount} received`,
            icon: '💰',
            bg: 'from-emerald-50 to-green-50',
            border: 'border-emerald-200',
            valueColor: 'text-emerald-700',
          },
          {
            label: 'Pending',
            value: formatINR(stats.pendingAmount),
            sub: `${stats.pendingCount} transaction${stats.pendingCount !== 1 ? 's' : ''}`,
            icon: '⏳',
            bg: 'from-amber-50 to-yellow-50',
            border: 'border-amber-200',
            valueColor: 'text-amber-700',
          },
          {
            label: 'Refunded',
            value: formatINR(stats.refundedAmount),
            sub: `${stats.refundedCount} refund${stats.refundedCount !== 1 ? 's' : ''}`,
            icon: '↩️',
            bg: 'from-red-50 to-rose-50',
            border: 'border-red-200',
            valueColor: 'text-red-600',
          },
          {
            label: 'Total Transactions',
            value: stats.totalCount,
            sub: 'all time',
            icon: '📊',
            bg: 'from-slate-50 to-gray-50',
            border: 'border-gray-200',
            valueColor: 'text-gray-800',
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border bg-gradient-to-br ${card.bg} ${card.border} p-5`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            <p className="text-xs text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {TABS.map((tab) => {
          const count =
            tab === 'all' ? stats.totalCount
            : tab === 'received' ? stats.receivedCount
            : tab === 'pending' ? stats.pendingCount
            : stats.refundedCount
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'received' && '✅'}
              {tab === 'pending' && '⏳'}
              {tab === 'refunded' && '↩️'}
              {tab === 'all' && '📋'}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl border border-gray-200 bg-white p-4 mb-5"
      >
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Order ID, customer, transaction ID…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Method</label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green/30 bg-white"
            >
              <option value="">All Methods</option>
              <option value="card">💳 Card</option>
              <option value="upi">📱 UPI</option>
              <option value="netbanking">🏦 Net Banking</option>
              <option value="cod">💵 COD</option>
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green/30"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green/30"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green/30 bg-white"
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
          </div>

          <button
            onClick={clearFilters}
            className="text-sm text-gray-400 hover:text-gray-600 underline pb-2"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Showing {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl">🔍</span>
          <p className="font-semibold text-gray-600">No transactions found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters or search query.</p>
          <button onClick={clearFilters} className="text-sm text-green underline mt-1">Clear filters</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, #0F172A, #1E293B)' }}>
                  {['Transaction', 'Customer', 'Date & Time', 'Amount', 'Method', 'Order Status', 'Tx Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((tx) => {
                  const cfg = STATUS_CONFIG[tx.txStatus]
                  return (
                    <tr key={tx.orderId} className="hover:bg-gray-50 transition-colors">
                      {/* Transaction / Order ID */}
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/admin/orders/${tx.orderId}`}
                          className="font-mono text-xs text-green hover:underline block max-w-[120px] truncate"
                          title={tx.orderId}
                        >
                          #{tx.orderId.slice(0, 8)}…
                        </Link>
                        {tx.transactionId && (
                          <p className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-[120px]" title={tx.transactionId}>
                            {tx.transactionId.slice(0, 12)}…
                          </p>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-800 text-sm">{tx.customer}</p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-gray-700 text-xs">
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        <p className={`font-bold text-sm ${tx.txStatus === 'refunded' ? 'text-red-500' : 'text-gray-800'}`}>
                          {tx.txStatus === 'refunded' ? '−' : ''}{formatINR(tx.amount)}
                        </p>
                      </td>

                      {/* Method */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                          {METHOD_LABELS[tx.method] || tx.method}
                        </span>
                      </td>

                      {/* Order Status */}
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                          tx.orderStatus === 'Delivered' ? 'bg-green/10 text-green' :
                          tx.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-600' :
                          tx.orderStatus === 'Shipped'   ? 'bg-blue-100 text-blue-600' :
                          tx.orderStatus === 'Processing'? 'bg-purple-100 text-purple-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {tx.orderStatus}
                        </span>
                      </td>

                      {/* Tx Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <p className="text-xs text-gray-400">
              {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} shown
            </p>
            <p className="text-xs font-semibold text-gray-700">
              Total: {formatINR(filtered.reduce((s, t) => s + (t.txStatus === 'refunded' ? 0 : t.amount), 0))}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
