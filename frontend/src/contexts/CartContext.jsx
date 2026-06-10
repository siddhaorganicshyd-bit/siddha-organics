import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import {
  getCart,
  addItem as serviceAddItem,
  updateQuantity as serviceUpdateQuantity,
  removeItem as serviceRemoveItem,
  clearCart as serviceClearCart,
  mergeGuestCart,
  computeCartTotals,
} from '../services/cartService'
import { seedSettings } from '../data/seedSettings'

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext(null)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadSettings() {
  try {
    const raw = localStorage.getItem('siddha_settings')
    if (!raw) return seedSettings
    return JSON.parse(raw)
  } catch {
    return seedSettings
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children, currentUser }) {
  const userId = currentUser?.id ?? 'guest'
  const [cart, setCart] = useState(() => getCart(userId))

  // Reload cart when user changes (login/logout)
  useEffect(() => {
    const newUserId = currentUser?.id ?? 'guest'
    const loadedCart = getCart(newUserId)
    setCart(loadedCart)
  }, [currentUser?.id])

  // Merge guest cart when user logs in
  useEffect(() => {
    if (currentUser?.id) {
      const merged = mergeGuestCart(currentUser.id)
      setCart(merged)
    }
  }, [currentUser?.id])

  // ─── Derived values ──────────────────────────────────────────────────────────

  const itemCount = useMemo(() => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart.items])

  const cartTotals = useMemo(() => {
    const settings = loadSettings()
    return computeCartTotals(cart, settings)
  }, [cart])

  // ─── Mutation operations ─────────────────────────────────────────────────────

  const addItem = useCallback(
    (productId, variantId, quantity, productData) => {
      const updated = serviceAddItem(userId, productId, variantId, quantity, productData)
      setCart(updated)
      return updated
    },
    [userId]
  )

  const updateQuantity = useCallback(
    (productId, variantId, quantity) => {
      const updated = serviceUpdateQuantity(userId, productId, variantId, quantity)
      setCart(updated)
      return updated
    },
    [userId]
  )

  const removeItem = useCallback(
    (productId, variantId) => {
      const updated = serviceRemoveItem(userId, productId, variantId)
      setCart(updated)
      return updated
    },
    [userId]
  )

  const clearCart = useCallback(() => {
    const updated = serviceClearCart(userId)
    setCart(updated)
    return updated
  }, [userId])

  // ─── Context value ───────────────────────────────────────────────────────────

  const value = {
    cart,
    itemCount,
    cartTotals,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartContext
