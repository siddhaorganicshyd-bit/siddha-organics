import React, { Suspense } from 'react'
import { createBrowserRouter, useRouteError } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute.jsx'
import AdminProtectedRoute from './AdminProtectedRoute.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import AccountLayout from '../layouts/AccountLayout.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'

// ─── Lazy page imports ────────────────────────────────────────────────────────

const HomePage = React.lazy(() => import('../pages/user/HomePage.jsx'))
const ShopPage = React.lazy(() => import('../pages/user/ShopPage.jsx'))
const ProductDetailPage = React.lazy(() => import('../pages/user/ProductDetailPage.jsx'))
const SearchResultsPage = React.lazy(() => import('../pages/user/SearchResultsPage.jsx'))
const CartPage = React.lazy(() => import('../pages/user/CartPage.jsx'))
const LoginPage = React.lazy(() => import('../pages/user/LoginPage.jsx'))
const RegisterPage = React.lazy(() => import('../pages/user/RegisterPage.jsx'))
const VerifyAccountPage = React.lazy(() => import('../pages/user/VerifyAccountPage.jsx'))
const ForgotPasswordPage = React.lazy(() => import('../pages/user/ForgotPasswordPage.jsx'))
const CheckoutPage = React.lazy(() => import('../pages/checkout/CheckoutPage.jsx'))
const OrderConfirmationPage = React.lazy(() => import('../pages/user/OrderConfirmationPage.jsx'))

const WishlistPage = React.lazy(() => import('../pages/user/WishlistPage.jsx'))
const AboutPage = React.lazy(() => import('../pages/user/AboutPage.jsx'))
const ContactPage = React.lazy(() => import('../pages/user/ContactPage.jsx'))
const FAQPage = React.lazy(() => import('../pages/user/FAQPage.jsx'))

const ProfilePage = React.lazy(() => import('../pages/account/ProfilePage.jsx'))
const OrderHistoryPage = React.lazy(() => import('../pages/account/OrderHistoryPage.jsx'))
const OrderDetailPage = React.lazy(() => import('../pages/account/OrderDetailPage.jsx'))
const AddressBookPage = React.lazy(() => import('../pages/account/AddressBookPage.jsx'))

const AdminLoginPage = React.lazy(() => import('../pages/admin/AdminLoginPage.jsx'))
const DashboardPage = React.lazy(() => import('../pages/admin/DashboardPage.jsx'))
const ProductListPage = React.lazy(() => import('../pages/admin/ProductListPage.jsx'))
const ProductFormPage = React.lazy(() => import('../pages/admin/ProductFormPage.jsx'))
const InventoryPage = React.lazy(() => import('../pages/admin/InventoryPage.jsx'))
const OrderManagementPage = React.lazy(() => import('../pages/admin/OrderManagementPage.jsx'))
const AdminOrderDetailPage = React.lazy(() => import('../pages/admin/AdminOrderDetailPage.jsx'))
const UserManagementPage = React.lazy(() => import('../pages/admin/UserManagementPage.jsx'))
const CouponsPage = React.lazy(() => import('../pages/admin/CouponsPage.jsx'))

const TransactionsPage = React.lazy(() => import('../pages/admin/TransactionsPage.jsx'))
const SettingsPage = React.lazy(() => import('../pages/admin/SettingsPage.jsx'))
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage.jsx'))

// ─── Suspense wrapper ─────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function withSuspense(Component) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

// ─── Route-level error boundary ───────────────────────────────────────────────

function RouteErrorBoundary() {
  const error = useRouteError()
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'An unexpected error occurred.'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-gray-800">Something went wrong</h1>
      <p className="text-gray-500 max-w-md">{message}</p>
      <a href="/" className="text-green-700 underline">
        Go back home
      </a>
    </div>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────

const router = createBrowserRouter([
  // ── Public / storefront routes ──────────────────────────────────────────────
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(HomePage) },
      { path: 'shop', element: withSuspense(ShopPage) },
      { path: 'shop/:productId', element: withSuspense(ProductDetailPage) },
      { path: 'search', element: withSuspense(SearchResultsPage) },
      { path: 'cart', element: withSuspense(CartPage) },
      { path: 'login', element: withSuspense(LoginPage) },
      { path: 'register', element: withSuspense(RegisterPage) },
      { path: 'verify-account', element: withSuspense(VerifyAccountPage) },
      { path: 'forgot-password', element: withSuspense(ForgotPasswordPage) },
      { path: 'about', element: withSuspense(AboutPage) },
      { path: 'contact', element: withSuspense(ContactPage) },
      { path: 'faq', element: withSuspense(FAQPage) },

      // ── User-protected routes ────────────────────────────────────────────────
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'wishlist', element: withSuspense(WishlistPage) },
          { path: 'checkout/*', element: withSuspense(CheckoutPage) },
          { path: 'order-confirmation/:orderId', element: withSuspense(OrderConfirmationPage) },
          {
            path: 'account',
            element: <AccountLayout />,
            children: [
              { path: 'profile', element: withSuspense(ProfilePage) },
              { path: 'orders', element: withSuspense(OrderHistoryPage) },
              { path: 'orders/:orderId', element: withSuspense(OrderDetailPage) },
              { path: 'addresses', element: withSuspense(AddressBookPage) },
            ],
          },
        ],
      },
    ],
  },

  // ── Admin login (public) ────────────────────────────────────────────────────
  {
    path: 'admin/login',
    element: withSuspense(AdminLoginPage),
    errorElement: <RouteErrorBoundary />,
  },

  // ── Admin-protected routes ──────────────────────────────────────────────────
  {
    path: 'admin',
    element: <AdminProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: 'dashboard', element: withSuspense(DashboardPage) },
          { path: 'products', element: withSuspense(ProductListPage) },
          { path: 'products/new', element: withSuspense(ProductFormPage) },
          { path: 'products/:id/edit', element: withSuspense(ProductFormPage) },
          { path: 'inventory', element: withSuspense(InventoryPage) },
          { path: 'orders', element: withSuspense(OrderManagementPage) },
          { path: 'orders/:orderId', element: withSuspense(AdminOrderDetailPage) },
          { path: 'users', element: withSuspense(UserManagementPage) },
          { path: 'transactions', element: withSuspense(TransactionsPage) },
          { path: 'coupons', element: withSuspense(CouponsPage) },
          { path: 'settings', element: withSuspense(SettingsPage) },
        ],
      },
    ],
  },

  // ── 404 catch-all ───────────────────────────────────────────────────────────
  {
    path: '*',
    element: withSuspense(NotFoundPage),
    errorElement: <RouteErrorBoundary />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
})

export default router
