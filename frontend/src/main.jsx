import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router/index.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { ProductProvider } from './contexts/ProductContext'
import { CartProvider } from './contexts/CartContext'
import { OrderProvider } from './contexts/OrderContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { useAuth } from './contexts/index.js'
import ChatBot from './components/ui/ChatBot.jsx'
import './index.css'

/**
 * CartContextWrapper reads currentUser from AuthContext and passes it
 * to CartProvider, which needs it to load the correct cart.
 */
function CartContextWrapper({ children }) {
  const { currentUser } = useAuth()
  return <CartProvider currentUser={currentUser}>{children}</CartProvider>
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ProductProvider>
        <CartContextWrapper>
          <WishlistProvider>
            <OrderProvider>
              <RouterProvider
                router={router}
                future={{
                  v7_startTransition: true,
                }}
              />
              <ChatBot />
            </OrderProvider>
          </WishlistProvider>
        </CartContextWrapper>
      </ProductProvider>
    </AuthProvider>
  </React.StrictMode>,
)
