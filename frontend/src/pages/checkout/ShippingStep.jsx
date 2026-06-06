import React, { useState } from 'react'
import { useAuth } from '../../contexts/index.js'
import Button from '../../components/ui/Button.jsx'
import FormField from '../../components/ui/FormField.jsx'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
]

const emptyForm = {
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pinCode: '',
  phone: '',
  saveAddress: false,
}

export default function ShippingStep({ initialData, onComplete }) {
  const { currentUser } = useAuth()

  const savedAddresses = currentUser?.addresses || []
  const [selectedSaved, setSelectedSaved] = useState(
    savedAddresses.length > 0 ? savedAddresses[0].id : 'new'
  )
  const [form, setForm] = useState(initialData || emptyForm)
  const [errors, setErrors] = useState({})

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        return !value.trim() ? 'Full name is required' : ''
      case 'line1':
        return !value.trim() ? 'Address line 1 is required' : ''
      case 'city':
        return !value.trim() ? 'City is required' : ''
      case 'state':
        return !value ? 'State is required' : ''
      case 'pinCode':
        if (!value.trim()) return 'PIN code is required'
        if (!/^\d{6}$/.test(value.trim())) return 'PIN code must be exactly 6 digits'
        return ''
      case 'phone':
        if (!value.trim()) return 'Phone number is required'
        if (!/^\d{10}$/.test(value.trim())) return 'Phone must be exactly 10 digits'
        return ''
      default:
        return ''
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSelectSaved = (addr) => {
    setSelectedSaved(addr.id)
    setForm({
      fullName: addr.fullName,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      pinCode: addr.pinCode,
      phone: addr.phone,
      saveAddress: false,
    })
    setErrors({})
  }

  const handleSubmit = (e) => {
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

    onComplete({
      fullName: form.fullName.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      state: form.state,
      pinCode: form.pinCode.trim(),
      phone: form.phone.trim(),
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-dark p-6">
      <h2 className="font-serif text-xl font-bold text-green mb-6">Shipping Address</h2>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-green mb-3">Saved Addresses</p>
          <div className="flex flex-col gap-2">
            {savedAddresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedSaved === addr.id
                    ? 'border-green bg-green/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="savedAddress"
                  checked={selectedSaved === addr.id}
                  onChange={() => handleSelectSaved(addr)}
                  className="mt-0.5 accent-green"
                />
                <div className="text-sm">
                  <p className="font-medium text-green">{addr.fullName}</p>
                  <p className="text-gray-500">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} – {addr.pinCode}
                  </p>
                  <p className="text-gray-500">{addr.phone}</p>
                </div>
              </label>
            ))}
            <label
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedSaved === 'new'
                  ? 'border-green bg-green/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="savedAddress"
                checked={selectedSaved === 'new'}
                onChange={() => { setSelectedSaved('new'); setForm(emptyForm); setErrors({}) }}
                className="accent-green"
              />
              <span className="text-sm font-medium text-green">+ Use a new address</span>
            </label>
          </div>
        </div>
      )}

      {/* Address Form */}
      {(selectedSaved === 'new' || savedAddresses.length === 0) && (
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <FormField
              id="fullName"
              name="fullName"
              label="Full name"
              value={form.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.fullName}
              placeholder="Recipient's full name"
            />
            <FormField
              id="phone"
              name="phone"
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.phone}
              placeholder="10-digit mobile number"
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
            placeholder="House/flat no., street name"
          />

          <FormField
            id="line2"
            name="line2"
            label="Address line 2 (optional)"
            value={form.line2}
            onChange={handleChange}
            placeholder="Landmark, area"
          />

          <div className="grid sm:grid-cols-3 gap-x-4">
            <FormField
              id="city"
              name="city"
              label="City"
              value={form.city}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.city}
              placeholder="City"
            />
            <div className="mb-4">
              <label htmlFor="state" className="block text-sm font-medium text-green mb-1">
                State
              </label>
              <select
                id="state"
                name="state"
                value={form.state}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green transition-colors ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
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
              placeholder="6-digit PIN"
              maxLength={6}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2">
            Continue to Payment
          </Button>
        </form>
      )}

      {/* If saved address selected, show continue button */}
      {selectedSaved !== 'new' && savedAddresses.length > 0 && (
        <Button
          variant="primary"
          size="lg"
          className="w-full mt-4"
          onClick={(e) => handleSubmit({ preventDefault: () => {} })}
        >
          Continue to Payment
        </Button>
      )}
    </div>
  )
}
