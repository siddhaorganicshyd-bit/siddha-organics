import React, { useState, useEffect } from 'react'
import { getToken } from '../../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    storeName: '',
    storeEmail: '',
    storePhone: '',
    taxRate: '',
    shippingCost: '',
    freeShippingThreshold: '',
    lowStockThreshold: '',
    maintenanceMode: false,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/settings`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      if (res.ok) {
        setForm({
          storeName: data.storeName ?? '',
          storeEmail: data.storeEmail ?? '',
          storePhone: data.storePhone ?? '',
          // taxRate stored as decimal (0.18) → display as percentage (18)
          taxRate: data.taxRate != null ? String(Math.round(data.taxRate * 100)) : '',
          // shippingCost stored in paise → display in INR
          shippingCost: data.shippingCost != null ? String(data.shippingCost / 100) : '',
          // freeShippingThreshold stored in paise → display in INR
          freeShippingThreshold: data.freeShippingThreshold != null ? String(data.freeShippingThreshold / 100) : '',
          lowStockThreshold: data.lowStockThreshold != null ? String(data.lowStockThreshold) : '',
          maintenanceMode: data.maintenanceMode ?? false,
        })
      }
    } catch {
      // silently fail — form stays empty
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const [fieldErrors, setFieldErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.storeName.trim()) errs.storeName = 'Store name is required.'
    else if (form.storeName.trim().length > 100) errs.storeName = 'Store name must be 100 characters or fewer.'

    if (!form.storeEmail.trim()) errs.storeEmail = 'Store email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.storeEmail.trim())) errs.storeEmail = 'Enter a valid email address.'

    if (!form.storePhone.trim()) errs.storePhone = 'Store phone is required.'
    else if (!/^\d{10}$/.test(form.storePhone.trim())) errs.storePhone = 'Phone must be exactly 10 digits.'

    const taxNum = parseFloat(form.taxRate)
    if (form.taxRate === '' || isNaN(taxNum)) errs.taxRate = 'Tax rate is required.'
    else if (taxNum < 0 || taxNum > 100) errs.taxRate = 'Tax rate must be between 0 and 100.'

    const shippingNum = parseFloat(form.shippingCost)
    if (form.shippingCost === '' || isNaN(shippingNum)) errs.shippingCost = 'Shipping cost is required.'
    else if (shippingNum < 0) errs.shippingCost = 'Shipping cost cannot be negative.'

    const thresholdNum = parseFloat(form.freeShippingThreshold)
    if (form.freeShippingThreshold === '' || isNaN(thresholdNum)) errs.freeShippingThreshold = 'Free shipping threshold is required.'
    else if (thresholdNum < 0) errs.freeShippingThreshold = 'Threshold cannot be negative.'
    else if (thresholdNum < shippingNum) errs.freeShippingThreshold = 'Free shipping threshold should be ≥ shipping cost.'

    const stockNum = parseInt(form.lowStockThreshold, 10)
    if (form.lowStockThreshold === '' || isNaN(stockNum)) errs.lowStockThreshold = 'Low stock threshold is required.'
    else if (stockNum < 0) errs.lowStockThreshold = 'Threshold cannot be negative.'

    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setSaving(true)
    try {
      const payload = {
        storeName: form.storeName,
        storeEmail: form.storeEmail,
        storePhone: form.storePhone,
        // taxRate: percentage → decimal (18 → 0.18)
        taxRate: parseFloat(form.taxRate) / 100,
        // shippingCost: INR → paise
        shippingCost: Math.round(parseFloat(form.shippingCost) * 100),
        // freeShippingThreshold: INR → paise
        freeShippingThreshold: Math.round(parseFloat(form.freeShippingThreshold) * 100),
        lowStockThreshold: parseInt(form.lowStockThreshold, 10),
        maintenanceMode: form.maintenanceMode,
      }

      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        showToast('Settings saved successfully.')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save settings.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-green-700 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">

          {/* Store Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Store Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={form.storeName}
                  onChange={handleChange}
                  maxLength={100}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.storeName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Siddha Organics"
                />
                {fieldErrors.storeName && <p className="text-xs text-red-500 mt-1">{fieldErrors.storeName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="storeEmail"
                  value={form.storeEmail}
                  onChange={handleChange}
                  maxLength={254}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.storeEmail ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="admin@siddhaorganics.com"
                />
                {fieldErrors.storeEmail && <p className="text-xs text-red-500 mt-1">{fieldErrors.storeEmail}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="storePhone"
                  value={form.storePhone}
                  onChange={handleChange}
                  maxLength={10}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.storePhone ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="9876543210"
                />
                {fieldErrors.storePhone && <p className="text-xs text-red-500 mt-1">{fieldErrors.storePhone}</p>}
              </div>
            </div>
          </div>

          {/* Pricing & Tax */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Pricing &amp; Tax</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="taxRate"
                    value={form.taxRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.taxRate ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    placeholder="18"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Enter as a percentage, e.g. 18 for 18%</p>
                {fieldErrors.taxRate && <p className="text-xs text-red-500 mt-1">{fieldErrors.taxRate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Cost (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    name="shippingCost"
                    value={form.shippingCost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.shippingCost ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    placeholder="50"
                  />
                </div>
                {fieldErrors.shippingCost && <p className="text-xs text-red-500 mt-1">{fieldErrors.shippingCost}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Free Shipping Threshold (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    name="freeShippingThreshold"
                    value={form.freeShippingThreshold}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.freeShippingThreshold ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    placeholder="500"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Orders above this amount get free shipping</p>
                {fieldErrors.freeShippingThreshold && <p className="text-xs text-red-500 mt-1">{fieldErrors.freeShippingThreshold}</p>}
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Inventory</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                value={form.lowStockThreshold}
                onChange={handleChange}
                min="0"
                step="1"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.lowStockThreshold ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                placeholder="10"
              />
              <p className="text-xs text-gray-400 mt-1">Products with stock at or below this number are flagged as low stock</p>
              {fieldErrors.lowStockThreshold && <p className="text-xs text-red-500 mt-1">{fieldErrors.lowStockThreshold}</p>}
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Site Status</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={form.maintenanceMode}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    form.maintenanceMode ? 'bg-amber-500' : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Maintenance Mode</p>
                <p className="text-xs text-gray-400">
                  {form.maintenanceMode
                    ? 'Site is in maintenance mode — customers will see a maintenance page'
                    : 'Site is live and accessible to customers'}
                </p>
              </div>
            </label>
          </div>

          {/* Inline error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              ⚠️ {error}
            </p>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
