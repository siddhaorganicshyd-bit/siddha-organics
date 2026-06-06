import React, { useState } from 'react'
import { useAuth } from '../../contexts/index.js'
import Button from '../../components/ui/Button.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Modal from '../../components/ui/Modal.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { generateUUID } from '../../utils/generateId'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
]

const emptyForm = {
  fullName: '', line1: '', line2: '', city: '', state: '', pinCode: '', phone: '',
}

function saveAddressesToStorage(userId, addresses) {
  try {
    const raw = localStorage.getItem('siddha_users')
    if (!raw) return
    const users = JSON.parse(raw)
    const idx = users.findIndex((u) => u.id === userId)
    if (idx !== -1) {
      users[idx].addresses = addresses
      localStorage.setItem('siddha_users', JSON.stringify(users))
    }
  } catch {}
}

export default function AddressBookPage() {
  const { currentUser } = useAuth()
  const [addresses, setAddresses] = useState(currentUser?.addresses || [])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName': return !value.trim() ? 'Full name is required' : ''
      case 'line1': return !value.trim() ? 'Address line 1 is required' : ''
      case 'city': return !value.trim() ? 'City is required' : ''
      case 'state': return !value ? 'State is required' : ''
      case 'pinCode':
        if (!value.trim()) return 'PIN code is required'
        if (!/^\d{6}$/.test(value.trim())) return 'PIN code must be 6 digits'
        return ''
      case 'phone':
        if (!value.trim()) return 'Phone is required'
        if (!/^\d{10}$/.test(value.trim())) return 'Phone must be 10 digits'
        return ''
      default: return ''
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (addr) => {
    setEditingId(addr.id)
    setForm({ ...addr })
    setErrors({})
    setShowModal(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    const requiredFields = ['fullName', 'line1', 'city', 'state', 'pinCode', 'phone']
    const newErrors = {}
    requiredFields.forEach((name) => {
      const err = validateField(name, form[name])
      if (err) newErrors[name] = err
    })
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    let updated
    if (editingId) {
      updated = addresses.map((a) => a.id === editingId ? { ...form, id: editingId } : a)
    } else {
      updated = [...addresses, { ...form, id: generateUUID() }]
    }
    setAddresses(updated)
    saveAddressesToStorage(currentUser.id, updated)
    setShowModal(false)
  }

  const handleDelete = (id) => {
    const updated = addresses.filter((a) => a.id !== id)
    setAddresses(updated)
    saveAddressesToStorage(currentUser.id, updated)
  }

  const handleSetDefault = (id) => {
    const updated = [
      addresses.find((a) => a.id === id),
      ...addresses.filter((a) => a.id !== id),
    ]
    setAddresses(updated)
    saveAddressesToStorage(currentUser.id, updated)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl font-bold text-green">Address Book</h1>
        <Button variant="primary" size="sm" onClick={openAdd}>
          + Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon="📍"
          heading="No saved addresses"
          description="Add a delivery address to speed up checkout."
          ctaLabel="Add Address"
          onCta={openAdd}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {addresses.map((addr, idx) => (
            <div
              key={addr.id}
              className={`bg-white rounded-xl border p-5 ${
                idx === 0 ? 'border-green' : 'border-cream-dark'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-green">{addr.fullName}</p>
                    {idx === 0 && (
                      <span className="text-xs bg-green text-cream px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                  <p className="text-gray-600">{addr.city}, {addr.state} – {addr.pinCode}</p>
                  <p className="text-gray-600">{addr.phone}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <button
                    onClick={() => openEdit(addr)}
                    className="text-xs text-green hover:text-green-dark underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs text-red-400 hover:text-red-600 underline"
                  >
                    Delete
                  </button>
                  {idx !== 0 && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs text-brown hover:text-brown-dark underline"
                    >
                      Set Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Address' : 'Add New Address'}
      >
        <form onSubmit={handleSave} noValidate>
          <div className="grid grid-cols-2 gap-x-4">
            <FormField
              id="fullName"
              name="fullName"
              label="Full name"
              value={form.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.fullName}
            />
            <FormField
              id="phone"
              name="phone"
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.phone}
            />
          </div>
          <FormField
            id="line1"
            name="line1"
            label="Address line 1"
            value={form.line1}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.line1}
          />
          <FormField
            id="line2"
            name="line2"
            label="Address line 2 (optional)"
            value={form.line2}
            onChange={handleChange}
          />
          <div className="grid grid-cols-3 gap-x-4">
            <FormField
              id="city"
              name="city"
              label="City"
              value={form.city}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.city}
            />
            <div className="mb-4">
              <label htmlFor="state" className="block text-sm font-medium text-green mb-1">State</label>
              <select
                id="state"
                name="state"
                value={form.state}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
            </div>
            <FormField
              id="pinCode"
              name="pinCode"
              label="PIN code"
              value={form.pinCode}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.pinCode}
              maxLength={6}
            />
          </div>
          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Save Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
