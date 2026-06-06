import React, { useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import FormField from '../../components/ui/FormField.jsx'
import { validateCardNumber, validateCardExpiry, validateUpiId, checkCodServiceability } from '../../services/paymentService.js'

const PAYMENT_METHODS = [
  { id: 'card', label: '💳 Card' },
  { id: 'upi', label: '📱 UPI' },
  { id: 'netbanking', label: '🏦 Net Banking' },
  { id: 'cod', label: '💵 Cash on Delivery' },
]

const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda',
  'Canara Bank', 'Union Bank of India', 'IndusInd Bank',
]

export default function PaymentStep({ shippingAddress, onComplete, onBack }) {
  const [method, setMethod] = useState('card')
  const [cardForm, setCardForm] = useState({ cardNumber: '', cardName: '', expiry: '', cvv: '' })
  const [upiId, setUpiId] = useState('')
  const [bank, setBank] = useState('')
  const [errors, setErrors] = useState({})
  const [codError, setCodError] = useState('')

  const validateCardField = (name, value) => {
    switch (name) {
      case 'cardNumber':
        if (!value.trim()) return 'Card number is required'
        if (!validateCardNumber(value)) return 'Enter a valid card number'
        return ''
      case 'cardName':
        return !value.trim() ? 'Cardholder name is required' : ''
      case 'expiry':
        if (!value.trim()) return 'Expiry date is required'
        if (!validateCardExpiry(value)) return 'Enter a valid expiry date (MM/YY)'
        return ''
      case 'cvv':
        if (!value.trim()) return 'CVV is required'
        if (!/^\d{3,4}$/.test(value.trim())) return 'CVV must be 3 or 4 digits'
        return ''
      default:
        return ''
    }
  }

  const handleCardBlur = (e) => {
    const { name, value } = e.target
    const error = validateCardField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleCardChange = (e) => {
    const { name, value } = e.target
    setCardForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    setCodError('')

    if (method === 'card') {
      const newErrors = {}
      Object.entries(cardForm).forEach(([name, value]) => {
        const err = validateCardField(name, value)
        if (err) newErrors[name] = err
      })
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }
      onComplete('card', {
        cardName: cardForm.cardName,
        expiry: cardForm.expiry,
        last4: cardForm.cardNumber.replace(/\s/g, '').slice(-4),
        // Never pass raw cardNumber or CVV forward
      })
    } else if (method === 'upi') {
      if (!upiId.trim()) {
        setErrors({ upiId: 'UPI ID is required' })
        return
      }
      if (!validateUpiId(upiId.trim())) {
        setErrors({ upiId: 'Enter a valid UPI ID (e.g. name@upi)' })
        return
      }
      onComplete('upi', { upiId: upiId.trim() })
    } else if (method === 'netbanking') {
      if (!bank) {
        setErrors({ bank: 'Please select a bank' })
        return
      }
      onComplete('netbanking', { bank })
    } else if (method === 'cod') {
      const pin = shippingAddress?.pinCode || ''
      if (!checkCodServiceability(pin)) {
        setCodError('Cash on Delivery is not available for your PIN code.')
        return
      }
      onComplete('cod', {})
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-dark p-6">
      <h2 className="font-serif text-xl font-bold text-green mb-6">Payment Method</h2>

      {/* Method Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PAYMENT_METHODS.map((pm) => (
          <button
            key={pm.id}
            type="button"
            onClick={() => { setMethod(pm.id); setErrors({}) }}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              method === pm.id
                ? 'bg-green text-cream border-green'
                : 'border-gray-300 text-green hover:border-green'
            }`}
          >
            {pm.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Card Form */}
        {method === 'card' && (
          <div>
            <FormField
              id="cardNumber"
              name="cardNumber"
              label="Card number"
              value={cardForm.cardNumber}
              onChange={handleCardChange}
              onBlur={handleCardBlur}
              error={errors.cardNumber}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
            <FormField
              id="cardName"
              name="cardName"
              label="Cardholder name"
              value={cardForm.cardName}
              onChange={handleCardChange}
              onBlur={handleCardBlur}
              error={errors.cardName}
              placeholder="Name as on card"
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="expiry"
                name="expiry"
                label="Expiry (MM/YY)"
                value={cardForm.expiry}
                onChange={handleCardChange}
                onBlur={handleCardBlur}
                error={errors.expiry}
                placeholder="MM/YY"
                maxLength={5}
              />
              <FormField
                id="cvv"
                name="cvv"
                label="CVV"
                type="password"
                value={cardForm.cvv}
                onChange={handleCardChange}
                onBlur={handleCardBlur}
                error={errors.cvv}
                placeholder="•••"
                maxLength={4}
              />
            </div>
          </div>
        )}

        {/* UPI Form */}
        {method === 'upi' && (
          <FormField
            id="upiId"
            name="upiId"
            label="UPI ID"
            value={upiId}
            onChange={(e) => { setUpiId(e.target.value); if (errors.upiId) setErrors({}) }}
            onBlur={() => {
              if (!upiId.trim()) setErrors({ upiId: 'UPI ID is required' })
              else if (!validateUpiId(upiId.trim())) setErrors({ upiId: 'Enter a valid UPI ID (e.g. name@upi)' })
            }}
            error={errors.upiId}
            placeholder="yourname@upi"
          />
        )}

        {/* Net Banking */}
        {method === 'netbanking' && (
          <div className="mb-4">
            <label htmlFor="bank" className="block text-sm font-medium text-green mb-1">
              Select Bank
            </label>
            <select
              id="bank"
              value={bank}
              onChange={(e) => { setBank(e.target.value); if (errors.bank) setErrors({}) }}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green ${
                errors.bank ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Choose your bank</option>
              {BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {errors.bank && <p className="text-xs text-red-500 mt-1">{errors.bank}</p>}
          </div>
        )}

        {/* COD */}
        {method === 'cod' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              Pay with cash when your order is delivered. Available for most PIN codes.
            </p>
            {codError && (
              <p className="text-sm text-red-600 mt-2">{codError}</p>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <Button type="button" variant="outline" size="lg" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" variant="primary" size="lg" className="flex-1">
            Review Order
          </Button>
        </div>
      </form>
    </div>
  )
}
