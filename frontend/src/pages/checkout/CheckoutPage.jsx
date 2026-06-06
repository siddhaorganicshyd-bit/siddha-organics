import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/index.js'
import ShippingStep from './ShippingStep.jsx'
import PaymentStep from './PaymentStep.jsx'
import ReviewStep from './ReviewStep.jsx'

const STEPS = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment', label: 'Payment' },
  { id: 'review', label: 'Review' },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState('shipping')
  const [checkoutData, setCheckoutData] = useState({
    shippingAddress: null,
    paymentMethod: null,
    paymentDetails: null,
  })

  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  const goToStep = (stepId) => setCurrentStep(stepId)

  const handleShippingComplete = (shippingAddress) => {
    setCheckoutData((prev) => ({ ...prev, shippingAddress }))
    setCurrentStep('payment')
  }

  const handlePaymentComplete = (paymentMethod, paymentDetails) => {
    setCheckoutData((prev) => ({ ...prev, paymentMethod, paymentDetails }))
    setCurrentStep('review')
  }

  const handleOrderPlaced = (orderId) => {
    navigate(`/order-confirmation/${orderId}`)
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-green mb-8 text-center">Checkout</h1>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    idx < currentIndex
                      ? 'bg-green text-cream'
                      : idx === currentIndex
                      ? 'bg-green text-cream ring-4 ring-green/20'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {idx < currentIndex ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    idx <= currentIndex ? 'text-green' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${
                    idx < currentIndex ? 'bg-green' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        {currentStep === 'shipping' && (
          <ShippingStep
            initialData={checkoutData.shippingAddress}
            onComplete={handleShippingComplete}
          />
        )}
        {currentStep === 'payment' && (
          <PaymentStep
            shippingAddress={checkoutData.shippingAddress}
            onComplete={handlePaymentComplete}
            onBack={() => setCurrentStep('shipping')}
          />
        )}
        {currentStep === 'review' && (
          <ReviewStep
            checkoutData={checkoutData}
            onBack={() => setCurrentStep('payment')}
            onOrderPlaced={handleOrderPlaced}
          />
        )}
      </div>
    </div>
  )
}
