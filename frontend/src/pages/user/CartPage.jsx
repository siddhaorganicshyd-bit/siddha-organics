import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/index.js'
import { useAuth } from '../../contexts/index.js'
import { formatINR } from '../../utils/formatCurrency'
import CartLineItem from '../../components/cart/CartLineItem.jsx'
import Button from '../../components/ui/Button.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

export default function CartPage() {
  const { cart, cartTotals, clearCart } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?returnUrl=/checkout/shipping')
    } else {
      navigate('/checkout/shipping')
    }
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="font-serif text-3xl font-bold text-green mb-8">Your Cart</h1>
          <EmptyState
            icon="🛒"
            heading="Your cart is empty"
            description="Looks like you haven't added anything yet. Browse our products and find something you love."
            ctaLabel="Start Shopping"
            onCta={() => navigate('/shop')}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl font-bold text-green">Your Cart</h1>
          <button
            onClick={clearCart}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-cream-dark p-5">
              {cart.items.map((item) => (
                <CartLineItem key={`${item.productId}-${item.variantId}`} item={item} />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-cream-dark p-5 sticky top-24">
              <h2 className="font-serif text-xl font-bold text-green mb-5">Order Summary</h2>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-green">{formatINR(cartTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium text-green">{formatINR(cartTotals.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green">
                    {cartTotals.shipping === 0 ? (
                      <span className="text-green font-semibold">Free</span>
                    ) : (
                      formatINR(cartTotals.shipping)
                    )}
                  </span>
                </div>
                {cartTotals.shipping > 0 && (
                  <p className="text-xs text-gray-400">
                    Free shipping on orders above ₹3,499
                  </p>
                )}
                <div className="border-t border-cream-dark pt-3 flex justify-between font-bold text-base">
                  <span className="text-green">Total</span>
                  <span className="text-brown">{formatINR(cartTotals.total)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-6"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>

              <Link
                to="/shop"
                className="block text-center text-sm text-green hover:text-green-dark mt-3 underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
