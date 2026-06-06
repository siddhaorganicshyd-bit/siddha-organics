# Implementation Plan: Production Readiness

## Overview

Migrate Siddha Organics from a prototype architecture (in-memory backend + localStorage frontend) to a production-ready architecture backed by MongoDB Atlas. This plan rewrites backend controllers to use Mongoose models, rewrites frontend services to use fetch() against the REST API, adds order confirmation emails, enables image upload, and applies production build optimizations.

## Tasks

- [ ] 1. Rewrite backend product controller to use Mongoose Product model
  - [ ] 1.1 Rewrite `backend/src/controllers/productController.js` — replace all `import { db } from '../data/store.js'` usage with Mongoose Product model queries
    - Import `Product` from `../models/Product.js`
    - Make all handler functions `async`
    - `getProducts`: use `Product.find(query).sort(sortObj)` with filtering (category, search, status) and sorting (price-asc, price-desc, newest, best-selling)
    - `getProduct`: use `Product.findById(id)` with fallback to `Product.findOne({ slug: id })`
    - `createProduct`: use `Product.create(payload)` with existing validation logic
    - `updateProduct`: use `Product.findByIdAndUpdate(id, update, { new: true, runValidators: true })`
    - `deleteProduct`: use `Product.findByIdAndDelete(id)`
    - `updateStock`: use `Product.findOneAndUpdate` with positional operator for variant stock
    - Wrap all operations in try/catch — return 400 for ValidationError/CastError, 500 for unexpected errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 10.1, 10.2, 10.3, 10.4_

- [ ] 2. Rewrite backend order controller to use Mongoose Order model
  - [ ] 2.1 Rewrite `backend/src/controllers/orderController.js` — replace all `import { db } from '../data/store.js'` usage with Mongoose Order and Product model queries
    - Import `Order` from `../models/Order.js` and `Product` from `../models/Product.js`
    - Make all handler functions `async`
    - `placeOrder`: use `Order.create(orderDoc)` + `Product.bulkWrite()` for stock decrements + call `sendOrderConfirmationEmail()` (fire-and-forget with try/catch)
    - `getMyOrders`: use `Order.find({ userId }).sort({ createdAt: -1 })`
    - `getOrder`: use `Order.findById(id)` with ownership/admin check
    - `getAllOrders`: use `Order.find(filterQuery).sort({ createdAt: -1 })` with optional filters (status, dateFrom, dateTo, paymentMethod)
    - `updateOrderStatus`: use `Order.findByIdAndUpdate()` with `$push` to statusHistory
    - `cancelOrder`: use `Order.findByIdAndUpdate()` + `Product.bulkWrite()` for stock restoration
    - Wrap all operations in try/catch — return 400 for ValidationError/CastError, 500 for unexpected errors
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 6.4, 10.1, 10.2, 10.3, 10.4_

- [ ] 3. Add seed data migration and order confirmation email
  - [ ] 3.1 Add product seed logic in `backend/src/index.js` — after `connectDB()`, check `Product.countDocuments()` and insert seed products from `store.js` data if collection is empty
    - Import `Product` from `./models/index.js`
    - Transform seed data to match Mongoose schema (remove manual `id` field, let Mongoose generate `_id`)
    - Log seed status to console
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 3.2 Add `sendOrderConfirmationEmail` function to `backend/src/services/emailService.js`
    - Export a new `async function sendOrderConfirmationEmail(to, order)`
    - Build HTML email template with Siddha Organics brand styling (matching existing OTP template)
    - Include: order ID, each item's product name and quantity, order total, shipping address, estimated delivery date
    - Use existing `createTransporter()` and `process.env.EMAIL_USER` as sender
    - In dev mode without credentials, log email details to console
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4. Checkpoint - Verify backend changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Rewrite frontend product service to use fetch API
  - [ ] 5.1 Rewrite `frontend/src/services/productService.js` — replace all localStorage operations with fetch() calls to the backend API
    - Read base URL from `import.meta.env.VITE_API_URL`
    - Make all functions `async`
    - `getProducts(params)`: `GET ${API_URL}/api/products?${query}`
    - `getProduct(id)`: `GET ${API_URL}/api/products/${id}`
    - `createProduct(payload)`: `POST ${API_URL}/api/products` with auth token
    - `updateProduct(id, update)`: `PUT ${API_URL}/api/products/${id}` with auth token
    - `deleteProduct(id)`: `DELETE ${API_URL}/api/products/${id}` with auth token
    - `updateStock(productId, variantId, stock)`: `PATCH ${API_URL}/api/products/${productId}/stock` with auth token
    - For all non-ok responses, throw Error with the API error message
    - Include `Authorization: Bearer <token>` header for admin write operations
    - Remove all localStorage product code, seed version logic, CSV import (keep in a separate utility if needed)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 6. Rewrite frontend order service to use fetch API
  - [ ] 6.1 Rewrite `frontend/src/services/orderService.js` — replace all localStorage operations with fetch() calls to the backend API
    - Read base URL from `import.meta.env.VITE_API_URL`
    - Make all functions `async`
    - `placeOrder(payload)`: `POST ${API_URL}/api/orders` with auth token and JSON body
    - `getUserOrders()`: `GET ${API_URL}/api/orders/my` with auth token
    - `getOrder(orderId)`: `GET ${API_URL}/api/orders/${orderId}` with auth token
    - `updateOrderStatus(orderId, status, note)`: `PATCH ${API_URL}/api/orders/${orderId}/status` with auth token
    - `cancelOrder(orderId)`: `POST ${API_URL}/api/orders/${orderId}/cancel` with auth token
    - `getAllOrders(filters)`: `GET ${API_URL}/api/orders?${query}` with auth token (admin)
    - For all non-ok responses, throw Error with the API error message
    - Include `Authorization: Bearer <token>` header for all requests
    - Remove all localStorage order code
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 7. Update frontend contexts for async API calls
  - [ ] 7.1 Update `frontend/src/contexts/ProductContext.jsx` — handle async API calls with loading and error states
    - Add `loading` and `error` state variables
    - Convert `useEffect` init to call async `getProducts()` service
    - Wrap all mutation methods (create, update, delete) in try/catch with loading/error handling
    - Expose `loading`, `error`, and a `refetch` function in context value
    - _Requirements: 3.1, 3.6_

  - [ ] 7.2 Update `frontend/src/contexts/OrderContext.jsx` — handle async API calls with loading and error states
    - Add `loading` and `error` state variables
    - Convert all operations to async with proper error propagation
    - `placeOrder`: call async service, update state on success
    - `getUserOrders`: call async service
    - `getOrder`, `updateOrderStatus`, `cancelOrder`: call async services
    - Expose `loading`, `error` in context value
    - _Requirements: 4.1, 4.2, 4.7_

  - [ ] 7.3 Update cart/checkout flow — placeOrder calls backend API, clears cart only on success
    - In the checkout component or OrderContext, call `orderService.placeOrder(payload)` (async)
    - Only call `clearCart()` from CartContext after the API confirms order creation
    - If API call fails, leave cart intact in localStorage and display error to user
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 8. Checkpoint - Verify frontend-backend integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Add product image upload support
  - [ ] 9.1 Add image upload functionality to the admin ProductFormPage
    - Add a file input that accepts JPEG, PNG, WebP images
    - Validate file type (must be image/jpeg, image/png, or image/webp)
    - Validate individual file size (reject if > 5MB with error message)
    - Convert selected files to base64 data URLs using `FileReader.readAsDataURL()`
    - Show image preview thumbnails before submission
    - Include base64 strings in the `images` array of the product create/update payload
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 10. Production build and configuration
  - [ ] 10.1 Update `frontend/index.html` with production meta tags
    - Add `<meta name="description">` with store description
    - Add Open Graph tags: `og:title`, `og:description`, `og:image`, `og:url`
    - Replace default Vite favicon with a custom favicon (`/favicon.png`)
    - Keep existing title and Google Fonts links
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 10.2 Update `frontend/vite.config.js` with code splitting for vendor chunk
    - Add `build.rollupOptions.output.manualChunks` with a `vendor` chunk for `react`, `react-dom`, `react-router-dom`
    - Vite already handles minification by default in production builds
    - _Requirements: 9.4, 9.5_

  - [ ] 10.3 Update backend CORS configuration in `backend/src/index.js` to be environment-aware
    - In production (`NODE_ENV === 'production'`): restrict CORS origin to only `FRONTEND_URL`
    - In development: allow localhost ports 5173, 5174, 5175 plus `FRONTEND_URL`
    - Keep `credentials: true`
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ] 10.4 Ensure frontend reads API base URL from `VITE_API_URL` environment variable
    - Verify `frontend/.env` contains `VITE_API_URL=http://localhost:5000`
    - All service files use `import.meta.env.VITE_API_URL` as the base URL
    - _Requirements: 8.1_

- [ ] 11. Final checkpoint - Integration verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the frontend builds successfully with `npm run build` in the frontend directory
  - Verify backend starts without errors and seeds products on empty database

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The existing Product and Order Mongoose models are already complete and do not need changes
- The `backend/src/data/store.js` file can be kept as reference for seed data but will no longer be imported by controllers
- Cart remains in localStorage per Requirement 5 — only `placeOrder` routes through the backend
- Image upload uses base64 encoding stored in MongoDB (the `express.json({ limit: '10mb' })` is already configured)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.2"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["5.1", "6.1"] },
    { "id": 3, "tasks": ["7.1", "7.2", "7.3"] },
    { "id": 4, "tasks": ["9.1", "10.1", "10.2", "10.3", "10.4"] }
  ]
}
```
