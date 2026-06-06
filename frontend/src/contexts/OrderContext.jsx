import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  placeOrder as servicePlaceOrder,
  getUserOrders as serviceGetUserOrders,
  getOrder as serviceGetOrder,
  getAllOrders as serviceGetAllOrders,
  updateOrderStatus as serviceUpdateOrderStatus,
  cancelOrder as serviceCancelOrder,
} from '../services/orderService'

// ─── Context ──────────────────────────────────────────────────────────────────

const OrderContext = createContext(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ─── Read operations ─────────────────────────────────────────────────────────

  const getUserOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await serviceGetUserOrders()
      setOrders(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getOrder = useCallback(async (orderId) => {
    try {
      setError(null)
      const data = await serviceGetOrder(orderId)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const getAllOrders = useCallback(async (filters = {}) => {
    try {
      setLoading(true)
      setError(null)
      const data = await serviceGetAllOrders(filters)
      setOrders(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // ─── Mutation operations ─────────────────────────────────────────────────────

  const placeOrder = useCallback(async (payload) => {
    try {
      setLoading(true)
      setError(null)
      const newOrder = await servicePlaceOrder(payload)
      setOrders((prev) => [...prev, newOrder])
      return newOrder
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateOrderStatus = useCallback(async (orderId, status, note) => {
    try {
      setError(null)
      const updated = await serviceUpdateOrderStatus(orderId, status, note)
      setOrders((prev) => prev.map((o) => (o._id === orderId || o.id === orderId) ? updated : o))
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const cancelOrder = useCallback(async (orderId) => {
    try {
      setError(null)
      const updated = await serviceCancelOrder(orderId)
      setOrders((prev) => prev.map((o) => (o._id === orderId || o.id === orderId) ? updated : o))
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // ─── Context value ───────────────────────────────────────────────────────────

  const value = {
    orders,
    loading,
    error,
    getUserOrders,
    getOrder,
    getAllOrders,
    placeOrder,
    updateOrderStatus,
    cancelOrder,
  }

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOrders() {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider')
  }
  return context
}

export default OrderContext
