import React, { useState, useEffect, useCallback } from 'react'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../../services/couponService.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(coupon) {
  if (coupon.type === 'percentage') return `${coupon.value}%`
  return `₹${coupon.value}`
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return '—'
  return new Date(expiresAt).toLocaleDateString('en-IN')
}

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  code: '',
  type: 'percentage',
  value: '',
  minOrderAmount: '',
  expiresAt: '',
  isActive: true,
}

// ─── CouponForm ───────────────────────────────────────────────────────────────

function CouponForm({ initial, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [localErrors, setLocalErrors] = useState({})

  // Sync when initial changes (e.g. switching from create to edit)
  useEffect(() => {
    setForm(initial || EMPTY_FORM)
    setLocalErrors({})
  }, [initial])

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (localErrors[field]) setLocalErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Client-side validation
    const errs = {}
    if (!form.code.trim()) errs.code = 'Code is required.'
    else if (!/^[A-Z0-9\-]{2,50}$/i.test(form.code.trim())) errs.code = 'Code must be 2–50 alphanumeric characters (hyphens allowed).'

    const val = parseFloat(form.value)
    if (form.value === '' || isNaN(val)) errs.value = 'Value is required.'
    else if (val < 0) errs.value = 'Value cannot be negative.'
    else if (form.type === 'percentage' && val > 100) errs.value = 'Percentage discount cannot exceed 100%.'

    if (form.minOrderAmount !== '' && form.minOrderAmount !== null) {
      const minAmt = parseFloat(form.minOrderAmount)
      if (isNaN(minAmt) || minAmt < 0) errs.minOrderAmount = 'Min order amount must be a non-negative number.'
    }

    if (form.expiresAt) {
      const expDate = new Date(form.expiresAt)
      if (isNaN(expDate.getTime())) errs.expiresAt = 'Enter a valid date.'
      else if (expDate <= new Date()) errs.expiresAt = 'Expiry date must be in the future.'
    }

    if (Object.keys(errs).length > 0) {
      setLocalErrors(errs)
      return
    }
    setLocalErrors({})
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.code}
          onChange={(e) => set('code', e.target.value.toUpperCase())}
          placeholder="e.g. SAVE20"
          maxLength={50}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 uppercase ${localErrors.code ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
        />
        {localErrors.code && <p className="text-xs text-red-500 mt-1">{localErrors.code}</p>}
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={form.type}
          onChange={(e) => set('type', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount (₹)</option>
        </select>
      </div>

      {/* Value */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Value <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          required
          min="0"
          max={form.type === 'percentage' ? 100 : undefined}
          step="any"
          value={form.value}
          onChange={(e) => set('value', e.target.value)}
          placeholder={form.type === 'percentage' ? 'e.g. 20 (max 100)' : 'e.g. 100'}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 ${localErrors.value ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
        />
        {localErrors.value && <p className="text-xs text-red-500 mt-1">{localErrors.value}</p>}
      </div>

      {/* Min Order Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Min Order Amount (INR) <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <input
          type="number"
          min="0"
          step="any"
          value={form.minOrderAmount}
          onChange={(e) => set('minOrderAmount', e.target.value)}
          placeholder="e.g. 500"
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 ${localErrors.minOrderAmount ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
        />
        {localErrors.minOrderAmount && <p className="text-xs text-red-500 mt-1">{localErrors.minOrderAmount}</p>}
      </div>

      {/* Expires At */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expiry Date <span className="text-gray-400 text-xs">(optional — must be future date)</span>
        </label>
        <input
          type="date"
          min={new Date().toISOString().split('T')[0]}
          value={form.expiresAt ? form.expiresAt.slice(0, 10) : ''}
          onChange={(e) => set('expiresAt', e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 ${localErrors.expiresAt ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
        />
        {localErrors.expiresAt && <p className="text-xs text-red-500 mt-1">{localErrors.expiresAt}</p>}
      </div>

      {/* Is Active */}
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set('isActive', e.target.checked)}
          className="w-4 h-4 accent-green-700 cursor-pointer"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
          Active
        </label>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-1">
        <Button variant="outline" size="sm" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={submitting}>
          {initial?.code ? 'Save Changes' : 'Create Coupon'}
        </Button>
      </div>
    </form>
  )
}

// ─── CouponsPage ──────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // null = create, object = edit
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, code }
  const [deleting, setDeleting] = useState(false)

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    const result = await listCoupons()
    if (result.success) {
      setCoupons(result.data)
    } else {
      showToast(result.error || 'Failed to load coupons.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  // ── Toast ────────────────────────────────────────────────────────────────────

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Modal helpers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (coupon) => {
    setEditTarget({
      ...coupon,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      minOrderAmount: coupon.minOrderAmount ?? '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setFormError('')
  }

  // ── Form submit ──────────────────────────────────────────────────────────────

  const handleFormSubmit = async (form) => {
    setSubmitting(true)
    setFormError('')

    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      isActive: form.isActive,
      ...(form.minOrderAmount !== '' && form.minOrderAmount !== null
        ? { minOrderAmount: parseFloat(form.minOrderAmount) }
        : {}),
      ...(form.expiresAt ? { expiresAt: form.expiresAt } : {}),
    }

    let result
    if (editTarget?._id) {
      result = await updateCoupon(editTarget._id, payload)
    } else {
      result = await createCoupon(payload)
    }

    if (result.success) {
      closeModal()
      await fetchCoupons()
      showToast(editTarget?._id ? 'Coupon updated.' : 'Coupon created.')
    } else {
      setFormError(result.error || 'Something went wrong.')
    }

    setSubmitting(false)
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDeleteClick = (coupon) => {
    setDeleteTarget({ id: coupon._id, code: coupon.code })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await deleteCoupon(deleteTarget.id)
    if (result.success) {
      setCoupons((prev) => prev.filter((c) => c._id !== deleteTarget.id))
      showToast('Coupon deleted.')
    } else {
      showToast(result.error || 'Failed to delete coupon.')
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const handleDeleteCancel = () => setDeleteTarget(null)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-gray-800">Coupons</h1>
        <Button variant="primary" size="sm" onClick={openCreate}>
          + New Coupon
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-green text-cream px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Coupon' : 'New Coupon'}
      >
        <CouponForm
          initial={editTarget}
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
          submitting={submitting}
          error={formError}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={handleDeleteCancel} title="Delete Coupon">
        <div className="p-1">
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete coupon{' '}
            <span className="font-semibold text-gray-900">{deleteTarget?.code}</span>?
          </p>
          <p className="text-sm text-red-600 mb-6">
            ⚠️ This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteCancel}
              disabled={deleting}
            >
              Cancel
            </Button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading coupons…</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🎟️</div>
          <p className="text-lg font-medium text-gray-600">No coupons yet</p>
          <p className="text-sm mt-1">Create your first coupon to offer discounts to customers.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Min Order (INR)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Expiry</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Active</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr
                  key={coupon._id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800 tracking-wide">
                    {coupon.code}
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{coupon.type}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{formatValue(coupon)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatExpiry(coupon.expiresAt)}</td>
                  <td className="px-4 py-3">
                    {coupon.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(coupon)}
                      >
                        Edit
                      </Button>
                      <button
                        onClick={() => handleDeleteClick(coupon)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
