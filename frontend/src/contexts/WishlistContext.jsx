import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getWishlist, addToWishlist, removeFromWishlist } from '../services/wishlistService'
import { useAuth } from './AuthContext'

// ─── Context ──────────────────────────────────────────────────────────────────

const WishlistContext = createContext(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WishlistProvider({ children }) {
  const { currentUser } = useAuth()
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const [loading, setLoading] = useState(false)

  // Fetch wishlist whenever auth state changes
  useEffect(() => {
    if (!currentUser) {
      // Not authenticated — clear wishlist
      setWishlistIds(new Set())
      return
    }

    let cancelled = false

    async function fetchWishlist() {
      setLoading(true)
      try {
        const data = await getWishlist()
        if (!cancelled) {
          setWishlistIds(new Set(data.productIds ?? []))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchWishlist()

    return () => {
      cancelled = true
    }
  }, [currentUser])

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Toggle a product in/out of the wishlist.
   * Performs an optimistic update and reverts on API error.
   * No-op if the user is not authenticated.
   */
  const toggleWishlist = useCallback(
    async (productId) => {
      if (!currentUser) return

      const alreadyWishlisted = wishlistIds.has(productId)

      // Optimistic update
      setWishlistIds((prev) => {
        const next = new Set(prev)
        if (alreadyWishlisted) {
          next.delete(productId)
        } else {
          next.add(productId)
        }
        return next
      })

      try {
        if (alreadyWishlisted) {
          await removeFromWishlist(productId)
        } else {
          await addToWishlist(productId)
        }
      } catch {
        // Revert optimistic update on error
        setWishlistIds((prev) => {
          const next = new Set(prev)
          if (alreadyWishlisted) {
            next.add(productId)
          } else {
            next.delete(productId)
          }
          return next
        })
      }
    },
    [currentUser, wishlistIds]
  )

  /**
   * Check whether a product is in the wishlist.
   * @param {string} productId
   * @returns {boolean}
   */
  const isWishlisted = useCallback(
    (productId) => wishlistIds.has(productId),
    [wishlistIds]
  )

  // ─── Context value ────────────────────────────────────────────────────────

  const value = {
    wishlistIds,
    loading,
    toggleWishlist,
    isWishlisted,
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

export default WishlistContext
