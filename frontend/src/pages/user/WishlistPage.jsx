import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useWishlist } from '../../contexts/index.js'
import { useProducts } from '../../contexts/index.js'
import ProductCard from '../../components/product/ProductCard.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'
import Button from '../../components/ui/Button.jsx'

export default function WishlistPage() {
  const { wishlistIds, toggleWishlist, loading } = useWishlist()
  const { products } = useProducts()
  const navigate = useNavigate()

  const wishlistedProducts = products.filter((p) => wishlistIds.has(p.id))

  if (loading) {
    return (
      <div className="bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <LoadingState message="Loading your wishlist…" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="font-serif text-3xl font-bold text-green">My Wishlist</h1>
          {wishlistedProducts.length > 0 && (
            <span className="inline-flex items-center justify-center bg-green text-cream text-sm font-bold rounded-full px-3 py-0.5 min-w-[2rem]">
              {wishlistedProducts.length}
            </span>
          )}
        </div>

        {/* Empty state */}
        {wishlistedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-4">
            <div className="text-6xl text-gray-300">🤍</div>
            <h3 className="font-serif text-xl text-green">Your wishlist is empty</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Save products you love by clicking the heart icon on any product card.
            </p>
            <Button variant="primary" size="md" onClick={() => navigate('/shop')}>
              Browse Shop
            </Button>
          </div>
        ) : (
          /* Product grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {wishlistedProducts.map((product) => (
              <div key={product.id} className="flex flex-col gap-2">
                <ProductCard product={product} showPrice />
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="w-full text-sm font-medium text-brown hover:text-brown-dark border border-brown hover:border-brown-dark rounded-lg py-2 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
