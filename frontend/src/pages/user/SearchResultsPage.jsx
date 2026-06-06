import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useProducts } from '../../contexts/index.js'
import ProductCard from '../../components/product/ProductCard.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { LoadingState } from '../../components/ui/Spinner.jsx'

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { searchProducts } = useProducts()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    let cancelled = false
    async function doSearch() {
      setLoading(true)
      try {
        const data = await searchProducts(query)
        if (!cancelled) setResults(data.filter((p) => p.status === 'active'))
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    doSearch()
    return () => { cancelled = true }
  }, [query, searchProducts])

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-green mb-2">
            Search Results
          </h1>
          {query && (
            <p className="text-gray-500">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;
              <span className="font-medium text-green">{query}</span>&rdquo;
            </p>
          )}
        </div>

        {!query.trim() ? (
          <EmptyState
            icon="🔍"
            heading="Enter a search term"
            description="Use the search bar above to find products."
            ctaLabel="Browse All Products"
            onCta={() => navigate('/shop')}
          />
        ) : products.length === 0 ? (
          <LoadingState message="Searching…" />
        ) : results.length === 0 ? (
          <EmptyState
            icon="😕"
            heading="No products found"
            description={`We couldn't find any products matching "${query}". Try a different search term.`}
            ctaLabel="Browse All Products"
            onCta={() => navigate('/shop')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
