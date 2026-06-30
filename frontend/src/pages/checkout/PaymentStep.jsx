import React, { useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import { checkCodServiceability } from '../../services/paymentService.js'

const PAYMENT_METHODS = [
  { id: 'razorpay', label: '⚡ Pay Online' },
  { id: 'cod', label: '💵 Cash on Delivery' },
]

const RAZORPAY_PAYMENT_LINK = 'https://razorpay.me/@siddhaorganics'

export default function PaymentStep({ shippingAddress, onComplete, onBack }) {
  const [method, setMethod] = useState('razorpay')
  const [errors, setErrors] = useState({})
  const [codError, setCodError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    setCodError('')

    if (method === 'razorpay') {
      onComplete('razorpay', { paymentLink: RAZORPAY_PAYMENT_LINK })
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
            onClick={() => { setMethod(pm.id); setErrors({}); setCodError('') }}
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
        {/* Razorpay Online Payment */}
        {method === 'razorpay' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 font-medium mb-2">
              Secure Online Payment via Razorpay
            </p>
            <p className="text-sm text-blue-700">
              Pay using UPI, Credit/Debit Card, Net Banking, or Wallet. You will be redirected to Razorpay's secure payment page after reviewing your order.
            </p>
            <div className="flex items-center gap-3 mt-3 text-xs text-blue-600">
              <span>UPI</span>
              <span>Cards</span>
              <span>Net Banking</span>
              <span>Wallets</span>
            </div>
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
