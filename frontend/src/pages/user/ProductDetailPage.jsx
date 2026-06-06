import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProducts, useWishlist } from '../../contexts/index.js'
import { useCart, useAuth } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import ProductCard from '../../components/product/ProductCard.jsx'
import QuantitySelector from '../../components/product/QuantitySelector.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { LoadingState, Spinner } from '../../components/ui/Spinner.jsx'
import { getReviews, createReview } from '../../services/reviewService.js'

// ─── Star display helpers ──────────────────────────────────────────────────────

function StarDisplay({ rating, max = 5, size = 'text-lg' }) {
  return (
    <span className={`inline-flex gap-0.5 ${size}`} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} aria-hidden="true" className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

// ─── Interactive star selector ─────────────────────────────────────────────────

function StarSelector({ value, onChange }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex gap-1" role="group" aria-label="Star rating selector">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          className="text-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-green focus:ring-offset-1 rounded"
        >
          <span
            aria-hidden="true"
            className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── Review form ───────────────────────────────────────────────────────────────

function ReviewForm({ productId, onReviewSubmitted }) {
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }
    if (body.trim().length < 10) {
      setError('Review must be at least 10 characters.')
      return
    }

    setSubmitting(true)
    const result = await createReview(productId, rating, body.trim())
    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Failed to submit review.')
      return
    }

    onReviewSubmitted()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-cream-dark rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-green text-base">Write a Review</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating</label>
        <StarSelector value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor="review-body" className="block text-sm font-medium text-gray-700 mb-1">
          Your Review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          minLength={10}
          placeholder="Share your experience with this product… (min 10 characters)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" size="md" loading={submitting} disabled={submitting}>
        Submit Review
      </Button>
    </form>
  )
}

// ─── Reviews section ───────────────────────────────────────────────────────────

function ReviewsSection({ productId }) {
  const { isAuthenticated, currentUser } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true)
    const result = await getReviews(productId)
    if (result.success) setReviews(result.data || [])
    setLoadingReviews(false)
  }, [productId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // Determine if the current user has already reviewed this product
  const currentUserId = currentUser?._id || currentUser?.id
  const userReview = reviews.find(
    (r) => (r.userId?._id || r.userId?.id || r.userId) === currentUserId
  )
  const hasReviewed = !!userReview

  // Compute average rating
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null

  return (
    <section className="mt-16">
      <h2 className="font-serif text-2xl font-bold text-green mb-6">Customer Reviews</h2>

      {/* Summary bar */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4 bg-white border border-cream-dark rounded-xl px-6 py-4 mb-8 w-fit">
          <span className="text-4xl font-bold text-brown">{avgRating}</span>
          <div>
            <StarDisplay rating={Math.round(Number(avgRating))} size="text-2xl" />
            <p className="text-sm text-gray-500 mt-0.5">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>
      )}

      {/* Review form / auth prompt */}
      {isAuthenticated ? (
        hasReviewed ? null : (
          <div className="mb-8">
            <ReviewForm productId={productId} onReviewSubmitted={fetchReviews} />
          </div>
        )
      ) : (
        <div className="mb-8 bg-cream border border-cream-dark rounded-xl px-5 py-4 text-sm text-gray-600">
          <Link to="/login" className="text-green font-medium hover:underline">Log in</Link>
          {' '}to write a review.
        </div>
      )}

      {/* Reviews list */}
      {loadingReviews ? (
        <div className="flex justify-center py-10">
          <Spinner size="md" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-sm py-6">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => {
            const isOwn = (review.userId?._id || review.userId?.id || review.userId) === currentUserId
            return (
              <div
                key={review._id}
                className={`bg-white border rounded-xl p-5 ${
                  isOwn ? 'border-green ring-1 ring-green/20' : 'border-cream-dark'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-green text-sm">
                      {review.userId?.fullName || 'Anonymous'}
                    </span>
                    {isOwn && (
                      <span className="text-xs font-medium bg-green text-cream px-2 py-0.5 rounded-full">
                        Your Review
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <StarDisplay rating={review.rating} size="text-base" />
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">{review.body}</p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { products, getProduct } = useProducts()
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const { isWishlisted, toggleWishlist } = useWishlist()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariantId, setSelectedVariantId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [addedToast, setAddedToast] = useState(false)
  const [errorToast, setErrorToast] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadProduct() {
      try {
        const p = await getProduct(productId)
        if (!cancelled && p) {
          setProduct(p)
          setSelectedVariantId(p.variants?.[0]?.id ?? p.variants?.[0]?._id ?? null)
        }
      } catch {
        // product not found
      }
      if (!cancelled) setLoading(false)
    }
    loadProduct()
    return () => { cancelled = true }
  }, [productId, getProduct])

  if (loading) return <LoadingState message="Loading product…" />

  if (!product) {
    return (
      <div className="bg-cream min-h-screen flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-2xl font-serif text-green">Product not found</p>
        <Link to="/shop" className="text-brown underline">Back to Shop</Link>
      </div>
    )
  }

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId)
  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0
  const stockStatus = isOutOfStock
    ? 'out-of-stock'
    : selectedVariant.stock < 10
    ? 'low-stock'
    : 'in-stock'

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return
    try {
      addItem(product.id, selectedVariant.id, quantity)
      setAddedToast(true)
      setTimeout(() => setAddedToast(false), 3000)
    } catch (err) {
      setErrorToast(err?.message || 'Could not add to cart')
      setTimeout(() => setErrorToast(''), 3000)
    }
  }

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category === product.category && p.status === 'active')
    .slice(0, 4)

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-green">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-green">Shop</Link>
          <span>/</span>
          <span className="text-green font-medium">{product.name}</span>
        </nav>

        {/* Toast notifications */}
        {addedToast && (
          <div className="fixed top-20 right-4 z-50 bg-green text-cream px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
            ✓ Added to cart!
          </div>
        )}
        {errorToast && (
          <div className="fixed top-20 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
            {errorToast}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-10 mb-16">
          {/* Image Gallery */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-white border border-cream-dark mb-3">
              <img
                src={product.images?.[activeImage] || 'https://placehold.co/600x400/F5F0E8/2D5016?text=Product'}
                alt={product.name}
                className="w-full object-cover aspect-square"
              />
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeImage === idx ? 'border-green' : 'border-cream-dark'
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-5">
            <div>
              <span className="text-xs font-medium text-brown uppercase tracking-wider">
                {product.category}
              </span>
              <h1 className="font-serif text-3xl font-bold text-green mt-1 mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600">{product.shortDescription}</p>
            </div>

            {/* Wishlist button */}
            <div>
              <button
                onClick={() => { if (isAuthenticated) toggleWishlist(product.id) }}
                aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                title={isAuthenticated ? undefined : 'Log in to save to wishlist'}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  isWishlisted(product.id)
                    ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-green hover:text-green'
                } ${!isAuthenticated ? 'opacity-60 cursor-default' : ''}`}
              >
                <span aria-hidden="true">{isWishlisted(product.id) ? '❤️' : '🤍'}</span>
                {isWishlisted(product.id) ? 'Saved ❤️' : 'Save to Wishlist'}
              </button>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl font-bold text-brown">
                {selectedVariant ? formatINR(selectedVariant.price) : '—'}
              </span>
              {selectedVariant?.mrp && selectedVariant.mrp > selectedVariant.price && (
                <>
                  <span className="text-base text-gray-400 line-through">
                    {formatINR(selectedVariant.mrp)}
                  </span>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedVariant.discountPercent}% OFF
                  </span>
                </>
              )}
              <Badge variant={stockStatus}>
                {stockStatus === 'out-of-stock'
                  ? 'Out of Stock'
                  : stockStatus === 'low-stock'
                  ? `Only ${selectedVariant.stock} left`
                  : 'In Stock'}
              </Badge>
            </div>

            {/* Variant Selector */}
            {product.variants?.length > 1 && (
              <div>
                <p className="text-sm font-medium text-green mb-2">Size / Weight</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVariantId(v.id); setQuantity(1) }}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors text-left ${
                        selectedVariantId === v.id
                          ? 'bg-green text-cream border-green'
                          : v.stock === 0
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-green hover:border-green'
                      }`}
                      disabled={v.stock === 0}
                    >
                      <span>{v.label}{v.stock === 0 && ' (OOS)'}</span>
                      <span className="block text-xs font-semibold mt-0.5">
                        {formatINR(v.price)}
                        {v.mrp && v.mrp > v.price && (
                          <span className={`ml-1 line-through font-normal ${selectedVariantId === v.id ? 'text-cream/60' : 'text-gray-400'}`}>
                            {formatINR(v.mrp)}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4">
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={selectedVariant?.stock || 1}
              />
              <Button
                variant="primary"
                size="lg"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="flex-1"
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>

            {/* Description */}
            <div className="border-t border-cream-dark pt-5">
              <h2 className="font-semibold text-green mb-3">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Ingredients */}
            {product.ingredients && (
              <div className="border-t border-cream-dark pt-5">
                <h2 className="font-semibold text-green mb-2">Ingredients</h2>
                <p className="text-gray-600 text-sm">{product.ingredients}</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl font-bold text-green mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <ReviewsSection productId={productId} />
      </div>
    </div>
  )
}
