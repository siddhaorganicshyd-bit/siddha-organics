import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/index.js'
import { useOrders } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import Badge from '../../components/ui/Badge.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'

export default function OrderHistoryPage() {
  const { currentUser } = useAuth()
  const { getUserOrders } = useOrders()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      if (currentUser?.id) {
        try {
          const userOrders = await getUserOrders()
          setOrders([...userOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        } catch {
          // failed to fetch orders
        }
      }
      setLoading(false)
    }
    loadOrders()
  }, [currentUser?.id, getUserOrders])

  if (loading) return <LoadingState message="Loading orders…" />

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-green mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          icon="📦"
          heading="No orders yet"
          description="You haven't placed any orders. Start shopping to see your orders here."
          ctaLabel="Shop Now"
          onCta={() => window.location.href = '/shop'}
        />
      ) : (
        <div className="bg-white rounded-xl border border-cream-dark overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream border-b border-cream-dark">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-green">Order ID</th>
                <th className="text-left px-4 py-3 font-semibold text-green">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-green">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-green">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-green">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-cream-dark last:border-0 hover:bg-cream/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-green">{order.id}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-medium text-brown">{formatINR(order.total)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={order.status}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="text-green hover:text-green-dark underline text-xs font-medium"
                    >
                      View Details
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
