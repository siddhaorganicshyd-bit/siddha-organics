import React, { useState } from 'react'
import { useProducts } from '../../contexts/index.js'
import { isLowStock } from '../../utils/productHelpers.js'
import Badge from '../../components/ui/Badge.jsx'

export default function InventoryPage() {
  const { products, updateStock } = useProducts()
  const [editingVariantId, setEditingVariantId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const handleEditStart = (variantId, currentStock) => {
    setEditingVariantId(variantId)
    setEditValue(String(currentStock))
  }

  const handleEditSave = (productId, variantId) => {
    const newStock = parseInt(editValue, 10)
    if (!isNaN(newStock) && newStock >= 0) {
      updateStock(productId, variantId, newStock)
    }
    setEditingVariantId(null)
    setEditValue('')
  }

  const handleKeyDown = (e, productId, variantId) => {
    if (e.key === 'Enter') handleEditSave(productId, variantId)
    if (e.key === 'Escape') { setEditingVariantId(null); setEditValue('') }
  }

  // Flatten all variants with product info
  const rows = []
  for (const product of products) {
    for (const variant of product.variants) {
      const lowStock = isLowStock(variant)
      const outOfStock = variant.stock === 0
      rows.push({ product, variant, lowStock, outOfStock })
    }
  }

  // Sort: out-of-stock first, then low-stock, then rest
  rows.sort((a, b) => {
    if (a.outOfStock && !b.outOfStock) return -1
    if (!a.outOfStock && b.outOfStock) return 1
    if (a.lowStock && !b.lowStock) return -1
    if (!a.lowStock && b.lowStock) return 1
    return a.product.name.localeCompare(b.product.name)
  })

  const getStockStatus = (row) => {
    if (row.outOfStock) return 'out-of-stock'
    if (row.lowStock) return 'low-stock'
    return 'in-stock'
  }

  const getStockLabel = (row) => {
    if (row.outOfStock) return 'Out of Stock'
    if (row.lowStock) return 'Low Stock'
    return 'In Stock'
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-gray-800 mb-6">Inventory</h1>

      <div className="flex gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          <span className="text-gray-600">Out of Stock</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
          <span className="text-gray-600">Low Stock</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
          <span className="text-gray-600">In Stock</span>
        </div>
        <span className="text-gray-400 ml-2">Click stock number to edit inline</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Variant</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Threshold</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, variant, lowStock, outOfStock }) => (
              <tr
                key={variant.id}
                className={`border-b border-gray-50 last:border-0 transition-colors ${
                  outOfStock
                    ? 'bg-red-50'
                    : lowStock
                    ? 'bg-amber-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                <td className="px-4 py-3 text-gray-600">{variant.label}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{variant.sku}</td>
                <td className="px-4 py-3">
                  {editingVariantId === variant.id ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleEditSave(product._id || product.id, variant.id)}
                      onKeyDown={(e) => handleKeyDown(e, product._id || product.id, variant.id)}
                      className="w-20 border border-green rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green"
                      autoFocus
                      min={0}
                    />
                  ) : (
                    <button
                      onClick={() => handleEditStart(variant.id, variant.stock)}
                      className={`font-semibold hover:underline cursor-pointer ${
                        outOfStock ? 'text-red-600' : lowStock ? 'text-amber-700' : 'text-gray-800'
                      }`}
                      title="Click to edit"
                    >
                      {variant.stock}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {variant.lowStockThreshold ?? 10}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getStockStatus({ outOfStock, lowStock })}>
                    {getStockLabel({ outOfStock, lowStock })}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
