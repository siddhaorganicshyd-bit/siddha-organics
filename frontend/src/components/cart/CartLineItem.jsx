import React from 'react'
import { Link } from 'react-router-dom'
import { useCart, useProducts } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import QuantitySelector from '../product/QuantitySelector.jsx'

export default function CartLineItem({ item }) {
  const { updateQuantity, removeItem } = useCart()
  const { products } = useProducts()

  // Look up product from context to get image, name, and variant label
  const product = products.find((p) => (p._id || p.id) === item.productId)
  const variant = product?.variants?.find((v) => (v._id || v.id) === item.variantId)

  const productName = item.productName || product?.name || 'Product'
  const variantLabel = item.variantLabel || variant?.label || ''
  const productImage = product?.images?.[0] || 'https://placehold.co/80x80/F5F0E8/2D5016?text=Product'

  const handleQuantityChange = (newQty) => {
    updateQuantity(item.productId, item.variantId, newQty)
  }

  const handleRemove = () => {
    removeItem(item.productId, item.variantId)
  }

  const lineTotal = item.priceAtAdd * item.quantity

  return (
    <div className="flex gap-4 py-5 border-b border-cream-dark last:border-0">
      {/* Product Image */}
      <Link to={`/shop/${item.productId}`} className="shrink-0">
        <img
          src={productImage}
          alt={productName}
          className="w-20 h-20 object-cover rounded-lg border border-cream-dark bg-cream"
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link to={`/shop/${item.productId}`}>
          <h3 className="font-semibold text-green text-sm hover:text-green-dark transition-colors line-clamp-2">
            {productName}
          </h3>
        </Link>
        {variantLabel && (
          <p className="text-xs text-gray-500 mt-0.5">{variantLabel}</p>
        )}
        <p className="text-sm font-medium text-brown mt-1">{formatINR(item.priceAtAdd)}</p>

        <div className="flex items-center justify-between mt-3">
          <QuantitySelector
            value={item.quantity}
            onChange={handleQuantityChange}
            min={1}
            max={variant?.stock || 99}
          />
          <div className="flex items-center gap-4">
            <span className="font-semibold text-green text-sm">{formatINR(lineTotal)}</span>
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500 transition-colors text-sm"
              aria-label="Remove item"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
