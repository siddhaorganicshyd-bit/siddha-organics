import React, { useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useOrders } from '../../contexts/index.js'
import { useProducts } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import Badge from '../../components/ui/Badge.jsx'
import { isLowStock } from '../../utils/productHelpers.js'

export default function DashboardPage() {
  const { orders, getAllOrders } = useOrders()
  const { products } = useProducts()

  // Load all orders on mount
  useEffect(() => {
    getAllOrders()
  }, [getAllOrders])

  const stats = useMemo(() => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)

    // Count low-stock variants
    let lowStockCount = 0
    for (const product of products) {
      for (const variant of product.variants) {
        if (isLowStock(variant)) lowStockCount++
      }
    }

    // Count users
    let newUsersCount = 0
    try {
      const raw = localStorage.getItem('siddha_users')
      if (raw) {
        const users = JSON.parse(raw)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        newUsersCount = users.filter(
          (u) => u.role === 'user' && new Date(u.createdAt) > thirtyDaysAgo
        ).length
      }
    } catch {}

    return { totalOrders, totalRevenue, lowStockCount, newUsersCount }
  }, [orders, products])

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
    [orders]
  )

  const kpiCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: '📦', link: '/admin/orders' },
    { label: 'Total Revenue', value: formatINR(stats.totalRevenue), icon: '💰', link: '/admin/orders' },
    { label: 'Low Stock Alerts', value: stats.lowStockCount, icon: '⚠️', link: '/admin/inventory', warn: stats.lowStockCount > 0 },
    { label: 'New Users (30d)', value: stats.newUsersCount, icon: '👥', link: '/admin/users' },
  ]

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${
              card.warn ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              {card.warn && (
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Action needed
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-green hover:text-green-dark underline">
            View All
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Order ID</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/admin/orders/${order.id}`} className="font-mono text-xs text-green hover:underline">
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{order.shippingAddress?.fullName || '—'}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-3 font-medium">{formatINR(order.total)}</td>
                  <td className="px-5 py-3">
                    <Badge variant={order.status}>{order.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/admin/products/new', label: 'Add Product', icon: '➕' },
          { to: '/admin/inventory', label: 'Manage Inventory', icon: '📋' },
          { to: '/admin/orders', label: 'View Orders', icon: '🛒' },
          { to: '/admin/users', label: 'Manage Users', icon: '👥' },
        ].map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
