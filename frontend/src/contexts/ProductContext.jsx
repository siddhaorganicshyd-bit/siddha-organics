import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getProducts as serviceGetProducts,
  getProduct as serviceGetProduct,
  searchProducts as serviceSearchProducts,
  createProduct as serviceCreateProduct,
  updateProduct as serviceUpdateProduct,
  deleteProduct as serviceDeleteProduct,
  updateStock as serviceUpdateStock,
} from '../services/productService'
import { parseCsvImport } from '../utils/productHelpers'

// ─── Context ──────────────────────────────────────────────────────────────────

const ProductContext = createContext(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch products from API on mount
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await serviceGetProducts()
      setProducts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // ─── Read operations ─────────────────────────────────────────────────────────

  const getProduct = useCallback(async (id) => {
    return serviceGetProduct(id)
  }, [])

  const searchProducts = useCallback(async (query) => {
    return serviceSearchProducts(query)
  }, [])

  // ─── Mutation operations ─────────────────────────────────────────────────────

  const createProduct = useCallback(async (payload) => {
    try {
      setError(null)
      const newProduct = await serviceCreateProduct(payload)
      setProducts((prev) => [...prev, newProduct])
      return newProduct
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const updateProduct = useCallback(async (id, update) => {
    try {
      setError(null)
      const updated = await serviceUpdateProduct(id, update)
      setProducts((prev) => prev.map((p) => (p._id === id || p.id === id) ? updated : p))
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const deleteProduct = useCallback(async (id) => {
    try {
      setError(null)
      await serviceDeleteProduct(id)
      setProducts((prev) => prev.filter((p) => p._id !== id && p.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const updateStock = useCallback(async (productId, variantId, newStock) => {
    try {
      setError(null)
      const updated = await serviceUpdateStock(productId, variantId, newStock)
      setProducts((prev) => prev.map((p) => (p._id === productId || p.id === productId) ? updated : p))
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  /**
   * Bulk import products from a CSV string.
   * Parses the CSV client-side, then creates each valid product via the API.
   */
  const bulkImport = useCallback(async (csv) => {
    const { valid, errors } = parseCsvImport(csv)
    const created = []
    for (const payload of valid) {
      try {
        const newProduct = await serviceCreateProduct(payload)
        created.push(newProduct)
      } catch (err) {
        errors.push({ row: 0, message: `Failed to create "${payload.name}": ${err.message}` })
      }
    }
    if (created.length > 0) {
      setProducts((prev) => [...prev, ...created])
    }
    return { created, errors }
  }, [])

  // ─── Context value ───────────────────────────────────────────────────────────

  const value = {
    products,
    loading,
    error,
    getProduct,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    bulkImport,
    refetch: fetchProducts,
  }

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProducts() {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}

export default ProductContext
