import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProducts } from '../../contexts/index.js'
import ProductCard from '../../components/product/ProductCard.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'
import { sortProducts } from '../../utils/productHelpers.js'

const CATEGORIES = ['Honey', 'Ghee', 'Sweeteners', 'Spices', 'Other']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'best-selling', label: 'Best Selling' },
]
const PAGE_SIZE = 8

export default function ShopPage() {
  const { products } = useProducts()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialCategory = searchParams.get('category') || ''
  const [selectedCategories, setSelectedCategories] = useState(
    initialCategory ? [initialCategory] : []
  )
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === 'active'),
    [products]
  )

  const filtered = useMemo(() => {
    let result = activeProducts
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category))
    }
    return sortProducts(result, sortBy)
  }, [activeProducts, selectedCategories, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleCategory = (cat) => {
    setPage(1)
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSort = (value) => {
    setSortBy(value)
    setPage(1)
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-green mb-8">Shop</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-56 shrink-0">
            <div className="bg-white rounded-xl border border-cream-dark p-5">
              <h2 className="font-semibold text-green mb-4">Categories</h2>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="accent-green w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{cat}</span>
                  </label>
                ))}
              </div>

              {selectedCategories.length > 0 && (
                <button
                  onClick={() => { setSelectedCategories([]); setPage(1) }}
                  className="mt-4 text-xs text-brown hover:text-brown-dark underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Sort + count bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              </p>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green bg-white"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {products.length === 0 ? (
              <LoadingState message="Loading products…" />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="🛍️"
                heading="No products found"
                description="Try adjusting your filters to find what you're looking for."
                ctaLabel="Clear Filters"
                onCta={() => { setSelectedCategories([]); setPage(1) }}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {paginated.map((product) => (
                    <ProductCard key={product.id} product={product} showPrice />
                  ))}
                </div>
                <div className="mt-8">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
