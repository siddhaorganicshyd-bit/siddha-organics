import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart, useWishlist } from '../../contexts/index.js'
import { useAuth } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import Button from '../ui/Button.jsx'

export default function ProductCard({ product, eager = false, hideAddToCart = false, showPrice = false }) {
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [pulse, setPulse] = useState(false)

  if (!product) return null

  const firstVariant = product.variants?.[0]
  const isOutOfStock = product.variants?.every((v) => v.stock === 0)
  const price = firstVariant?.price ?? 0
  const mrp = firstVariant?.mrp ?? null
  const discountPercent = firstVariant?.discountPercent ?? null
  const hasDiscount = mrp && mrp > price

  const handleAddToCart = (e) => {
    e.preventDefault()
    if (!firstVariant || isOutOfStock) return
    addItem(product.id || product._id, firstVariant.id || firstVariant._id, 1, product)
    setPulse(true)
    setTimeout(() => setPulse(false), 400)
  }

  const handleWishlistToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) return
    toggleWishlist(product.id)
  }

  const wishlisted = isWishlisted(product.id)

  return (
    <Link
      to={`/shop/${product.id}`}
      className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-cream-dark"
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden rounded-t-xl" style={{ aspectRatio: '1/1', background: '#F5F0E8' }}>
        <img
          src={product.images?.[0] || 'https://placehold.co/400x400/F5F0E8/2D5016?text=Siddha+Organics'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading={eager ? 'eager' : 'lazy'}
        />
        {/* Discount badge */}
        {hasDiscount && discountPercent && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {discountPercent}% OFF
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {/* Wishlist heart button */}
        <button
          onClick={handleWishlistToggle}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isAuthenticated ? (wishlisted ? 'Remove from wishlist' : 'Add to wishlist') : 'Log in to save'}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors z-10"
        >
          <span className="text-base leading-none" aria-hidden="true">
            {wishlisted ? '❤️' : '🤍'}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-serif text-base font-semibold text-green line-clamp-2 group-hover:text-green-light transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 flex-1">{product.shortDescription}</p>
        {showPrice && (
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <span className="font-bold text-brown text-sm">{formatINR(price)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">{formatINR(mrp)}</span>
            )}
          </div>
        )}
        {!hideAddToCart && (
          <div className="mt-2">
            <Button
              variant="primary"
              size="sm"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`w-full ${pulse ? 'scale-110' : ''}`}
              style={{ transition: 'transform 0.2s' }}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        )}
      </div>
    </Link>
  )
}
