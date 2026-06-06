import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProducts } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

export default function ProductListPage() {
  const { products, updateProduct, deleteProduct } = useProducts()
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState(null)
  const [sortField, setSortField] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = [...products].sort((a, b) => {
    let aVal, bVal
    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'category':
        aVal = a.category.toLowerCase()
        bVal = b.category.toLowerCase()
        break
      case 'price':
        aVal = a.variants?.[0]?.price ?? 0
        bVal = b.variants?.[0]?.price ?? 0
        break
      case 'stock':
        aVal = a.variants?.reduce((s, v) => s + v.stock, 0) ?? 0
        bVal = b.variants?.reduce((s, v) => s + v.stock, 0) ?? 0
        break
      default:
        return 0
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const handleToggleStatus = (product) => {
    updateProduct(product.id, {
      status: product.status === 'active' ? 'inactive' : 'active',
    })
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct(deleteId)
      setDeleteId(null)
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="text-green ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-gray-800">Products</h1>
        <Button variant="primary" onClick={() => navigate('/admin/products/new')}>
          + Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon="📦"
          heading="No products yet"
          description="Add your first product to get started."
          ctaLabel="Add Product"
          onCta={() => navigate('/admin/products/new')}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-16">Image</th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-green"
                  onClick={() => handleSort('name')}
                >
                  Name <SortIcon field="name" />
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-green"
                  onClick={() => handleSort('category')}
                >
                  Category <SortIcon field="category" />
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-green"
                  onClick={() => handleSort('price')}
                >
                  Price <SortIcon field="price" />
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-green"
                  onClick={() => handleSort('stock')}
                >
                  Stock <SortIcon field="stock" />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((product) => {
                const totalStock = product.variants?.reduce((s, v) => s + v.stock, 0) ?? 0
                const minPrice = product.variants?.length
                  ? Math.min(...product.variants.map((v) => v.price))
                  : 0

                return (
                  <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <img
                        src={product.images?.[0] || 'https://placehold.co/48x48/F5F0E8/2D5016?text=P'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category}</td>
                    <td className="px-4 py-3 text-gray-600">{formatINR(minPrice)}</td>
                    <td className="px-4 py-3 text-gray-600">{totalStock}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                          product.status === 'active'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {product.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="text-xs text-green hover:text-green-dark underline"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="text-xs text-red-400 hover:text-red-600 underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product">
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete this product? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleDelete} className="flex-1">
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
