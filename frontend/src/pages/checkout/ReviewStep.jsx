import React, { useState } from 'react'
import { useCart } from '../../contexts/index.js'
import { useAuth } from '../../contexts/index.js'
import { useOrders } from '../../contexts/index.js'
import { useProducts } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import { processPayment } from '../../services/paymentService.js'
import { validateCoupon } from '../../services/couponService.js'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'

export default function ReviewStep({ checkoutData, onBack, onOrderPlaced }) {
  const { cart, cartTotals, clearCart } = useCart()
  const { currentUser } = useAuth()
  const { placeOrder } = useOrders()
  const { products } = useProducts()

  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  // 'idle' | 'processing' | 'success' | 'failed'
  const [paymentState, setPaymentState] = useState('idle')

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null) // { code, discount, discountedTotal }
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const { shippingAddress, paymentMethod, paymentDetails } = checkoutData

  const isCod = paymentMethod === 'cod'

  const getPaymentLabel = () => {
    switch (paymentMethod) {
      case 'card':
        return `Card ending in ${paymentDetails?.last4 || '****'}`
      case 'upi':
        return `UPI: ${paymentDetails?.upiId}`
      case 'netbanking':
        return `Net Banking: ${paymentDetails?.bank}`
      case 'cod':
        return 'Cash on Delivery'
      default:
        return paymentMethod
    }
  }

  const handleApplyCoupon = async () => {
    const trimmed = couponCode.trim().toUpperCase()
    if (!trimmed) {
      setCouponError('Please enter a coupon code.')
      return
    }
    if (trimmed.length > 50) {
      setCouponError('Coupon code is too long.')
      return
    }
    if (!/^[A-Z0-9\-]+$/.test(trimmed)) {
      setCouponError('Coupon code can only contain letters, numbers, and hyphens.')
      return
    }
    setCouponLoading(true)
    setCouponError('')
    const result = await validateCoupon(trimmed, cartTotals.subtotal)
    setCouponLoading(false)
    if (result.success) {
      setAppliedCoupon({
        code: trimmed.toUpperCase(),
        discount: result.data.discount,
        discountedTotal: result.data.discountedTotal,
      })
    } else {
      setCouponError(result.error || 'Invalid coupon code.')
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const handlePlaceOrder = async () => {
    setPaymentError('')
    setProcessing(true)

    // For COD: place the order immediately — no payment processing needed
    if (isCod) {
      try {
        const order = await placeOrder({
          userId: currentUser.id,
          items: cart.items,
          products,
          shippingAddress,
          payment: {
            method: 'cod',
            transactionId: null,
            paidAt: null,
          },
          subtotal: cartTotals.subtotal,
          tax: cartTotals.tax,
          shippingCost: cartTotals.shipping,
          total: cartTotals.total,
          discount: appliedCoupon?.discount || 0,
        })
        // Clear cart only after successful API response
        clearCart()
        onOrderPlaced(order._id || order.id)
      } catch (err) {
        setPaymentError('Failed to place order. Please try again.')
      } finally {
        setProcessing(false)
      }
      return
    }

    // For online payments: process payment first, then place order on success
    setPaymentState('processing')

    try {
      // Calculate final amount (subtract coupon discount if applied)
      const finalAmount = appliedCoupon
        ? cartTotals.total - appliedCoupon.discount
        : cartTotals.total

      const result = await processPayment(finalAmount, {
        name: currentUser?.fullName || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
      })

      if (result.success) {
        setPaymentState('success')
        const order = await placeOrder({
          userId: currentUser.id,
          items: cart.items,
          products,
          shippingAddress,
          payment: {
            method: paymentMethod,
            transactionId: result.transactionId,
            paidAt: new Date().toISOString(),
          },
          subtotal: cartTotals.subtotal,
          tax: cartTotals.tax,
          shippingCost: cartTotals.shipping,
          total: cartTotals.total,
          discount: appliedCoupon?.discount || 0,
        })
        // Clear cart only after successful API response
        clearCart()
        // Brief pause so user sees the success state before navigating
        setTimeout(() => onOrderPlaced(order._id || order.id), 800)
      } else {
        setPaymentState('failed')
        setPaymentError(result.error || 'Payment failed. Please try again.')
      }
    } catch (err) {
      setPaymentState('failed')
      setPaymentError('An unexpected error occurred. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-dark p-6">
      <h2 className="font-serif text-xl font-bold text-green mb-6">Review Your Order</h2>

      {/* Order Items */}
      <div className="mb-6">
        <h3 className="font-semibold text-green mb-3 text-sm uppercase tracking-wide">Items</h3>
        <div className="flex flex-col gap-3">
          {cart.items.map((item) => (
            <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
              <div>
                <span className="font-medium text-green">{item.productName}</span>
                {item.variantLabel && (
                  <span className="text-gray-500 ml-1">({item.variantLabel})</span>
                )}
                <span className="text-gray-500 ml-2">× {item.quantity}</span>
              </div>
              <span className="font-medium text-brown">
                {formatINR(item.priceAtAdd * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="border-t border-cream-dark pt-5 mb-5">
        <h3 className="font-semibold text-green mb-2 text-sm uppercase tracking-wide">
          Shipping Address
        </h3>
        {shippingAddress && (
          <div className="text-sm text-gray-600">
            <p className="font-medium text-green">{shippingAddress.fullName}</p>
            <p>{shippingAddress.line1}{shippingAddress.line2 ? `, ${shippingAddress.line2}` : ''}</p>
            <p>{shippingAddress.city}, {shippingAddress.state} – {shippingAddress.pinCode}</p>
            <p>{shippingAddress.phone}</p>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="border-t border-cream-dark pt-5 mb-5">
        <h3 className="font-semibold text-green mb-2 text-sm uppercase tracking-wide">
          Payment
        </h3>
        <p className="text-sm text-gray-600">{getPaymentLabel()}</p>
      </div>

      {/* Coupon Code */}
      <div className="border-t border-cream-dark pt-5 mb-5">
        <h3 className="font-semibold text-green mb-3 text-sm uppercase tracking-wide">
          Coupon Code
        </h3>
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-green/5 border border-green/30 rounded-lg px-4 py-3 text-sm">
            <span className="text-green font-medium">🎉 Coupon <strong>{appliedCoupon.code}</strong> applied</span>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-red-500 hover:text-red-700 text-xs underline ml-4"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase())
                if (couponError) setCouponError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              placeholder="Enter coupon code"
              maxLength={50}
              className="flex-1 border border-cream-dark rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyCoupon}
              loading={couponLoading}
              disabled={couponLoading}
            >
              Apply
            </Button>
          </div>
        )}
        {couponError && (
          <p className="text-red-600 text-xs mt-2">{couponError}</p>
        )}
      </div>

      {/* Order Total */}
      <div className="border-t border-cream-dark pt-5 mb-6">
        <h3 className="font-semibold text-green mb-3 text-sm uppercase tracking-wide">
          Total Breakdown
        </h3>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatINR(cartTotals.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">GST (18%)</span>
            <span>{formatINR(cartTotals.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span>{cartTotals.shipping === 0 ? 'Free' : formatINR(cartTotals.shipping)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-green">
              <span>Coupon: {appliedCoupon.code}</span>
              <span>−{formatINR(appliedCoupon.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t border-cream-dark pt-2 mt-1">
            <span className="text-green">Total</span>
            <span className="text-brown">
              {appliedCoupon
                ? formatINR(cartTotals.total - appliedCoupon.discount)
                : formatINR(cartTotals.total)}
            </span>
          </div>
        </div>
      </div>

      {paymentError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          ⚠️ {paymentError}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          className="flex-1"
          disabled={processing || paymentState === 'processing' || paymentState === 'success'}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="flex-1"
          loading={processing || paymentState === 'processing'}
          disabled={processing || paymentState === 'processing' || paymentState === 'success'}
          onClick={handlePlaceOrder}
        >
          {isCod ? 'Place Order' : 'Pay & Place Order'}
        </Button>
      </div>

      {/* Payment Processing Modal — shown only for online payments */}
      <Modal isOpen={paymentState === 'processing' || paymentState === 'success'} onClose={() => {}} title="">
        <div className="flex flex-col items-center gap-4 py-6 px-2">
          {paymentState === 'processing' ? (
            <>
              <div className="w-14 h-14 border-4 border-green border-t-transparent rounded-full animate-spin" />
              <p className="font-semibold text-green text-lg">Processing payment…</p>
              <p className="text-sm text-gray-500 text-center">
                Please do not close this window.<br />Your payment is being verified.
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-green/10 rounded-full flex items-center justify-center text-3xl">
                ✅
              </div>
              <p className="font-semibold text-green text-lg">Payment Confirmed!</p>
              <p className="text-sm text-gray-500">Placing your order…</p>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
