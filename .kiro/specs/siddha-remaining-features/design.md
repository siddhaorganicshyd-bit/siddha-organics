# Design Document — Siddha Organics: Remaining Features

## Overview

This document covers the technical architecture for seven remaining features of the Siddha Organics
e-commerce platform. All features integrate with the existing Express + MongoDB/Mongoose backend and
React 18 + React Router v6 frontend. The green/cream/brown Tailwind theme is used throughout; no
external UI libraries are introduced.

---

## Architecture Summary

### Backend conventions (existing patterns)

- Models: `backend/src/models/` exported from `backend/src/models/index.js`
- Routes: `backend/src/routes/` mounted in `backend/src/index.js`
- Controllers: `backend/src/controllers/`
- Auth: `protect` (JWT required) and `adminOnly` (role check) from `backend/src/middleware/auth.js`
- Monetary values stored in **paise** (1 INR = 100 paise); displayed in INR on the frontend

### Frontend conventions (existing patterns)

- Pages: `frontend/src/pages/{section}/`
- Components: `frontend/src/components/{category}/`
- Services (API calls): `frontend/src/services/`
- Contexts: `frontend/src/contexts/`
- Currency: `formatINR()` from `frontend/src/utils/formatCurrency`
- UI primitives: Button, FormField, Input, Badge, Modal, Spinner — all hand-crafted
- Router: lazy imports + `withSuspense()` wrapper in `frontend/src/router/index.jsx`

---

## Feature 1 — Wishlist

### Backend

**New model** `backend/src/models/Wishlist.js`:
```js
{
  userId:     { type: ObjectId, ref: 'User', required: true, unique: true },
  productIds: [{ type: String, required: true }],  // product IDs (localStorage-based, strings)
  updatedAt:  { type: Date, default: Date.now }
}
```

**New controller** `backend/src/controllers/wishlistController.js`:
- `getWishlist(req, res)` — GET /api/wishlist → returns `{ productIds: [...] }`
- `addToWishlist(req, res)` — POST /api/wishlist/:productId → 409 if duplicate, else push
- `removeFromWishlist(req, res)` — DELETE /api/wishlist/:productId → pull from array

**New route** `backend/src/routes/wishlist.js`:
- All routes use `protect` middleware
- `GET /` → getWishlist
- `POST /:productId` → addToWishlist
- `DELETE /:productId` → removeFromWishlist

**Mount in** `backend/src/index.js`: `app.use('/api/wishlist', wishlistRoutes)`

### Frontend

**New service** `frontend/src/services/wishlistService.js`:
- `getWishlist()` → GET /api/wishlist
- `addToWishlist(productId)` → POST /api/wishlist/:productId
- `removeFromWishlist(productId)` → DELETE /api/wishlist/:productId

**New context** `frontend/src/contexts/WishlistContext.jsx`:
- State: `wishlistIds: Set<string>`, `loading: boolean`
- On mount (if authenticated): fetch wishlist from API
- `toggleWishlist(productId)` — optimistic update + API call
- `isWishlisted(productId)` — boolean check
- Export `useWishlist` hook

**New page** `frontend/src/pages/user/WishlistPage.jsx`:
- Route: `/wishlist` (protected)
- Fetches wishlist product IDs, looks up products from ProductContext
- Renders product cards in a grid with remove button
- Empty state with "Browse Shop" CTA

**Modify** `frontend/src/components/product/ProductCard.jsx`:
- Add heart icon button (top-right corner)
- Filled ❤️ if wishlisted, outlined 🤍 if not
- Calls `toggleWishlist` on click; shows login prompt if unauthenticated

**Modify** `frontend/src/pages/user/ProductDetailPage.jsx`:
- Add heart icon button near the product title
- Same toggle behaviour as ProductCard

**Modify** `frontend/src/contexts/index.js`: export `useWishlist`

**Modify** `frontend/src/router/index.jsx`: add `/wishlist` protected route

**Modify** `frontend/src/components/layout/Navbar.jsx`: add wishlist icon (🤍) with count badge

---

## Feature 2 — Product Reviews & Ratings

### Backend

**New model** `backend/src/models/Review.js`:
```js
{
  productId: { type: String, required: true, index: true },  // string ID (localStorage products)
  userId:    { type: ObjectId, ref: 'User', required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  body:      { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}
// Compound unique index: { productId, userId } — one review per user per product
```

**New controller** `backend/src/controllers/reviewController.js`:
- `getReviews(req, res)` — GET /api/reviews?productId=:id → sorted by createdAt desc, populate userId.fullName
- `createReview(req, res)` — POST /api/reviews (protect) → 409 if duplicate, 422 if invalid

**New route** `backend/src/routes/reviews.js`:
- `GET /` → getReviews (public)
- `POST /` → protect → createReview

**Mount in** `backend/src/index.js`: `app.use('/api/reviews', reviewRoutes)`

### Frontend

**New service** `frontend/src/services/reviewService.js`:
- `getReviews(productId)` → GET /api/reviews?productId=:id
- `createReview(productId, rating, body)` → POST /api/reviews

**Modify** `frontend/src/pages/user/ProductDetailPage.jsx`:
- Add `ReviewsSection` sub-component at the bottom of the page
- On mount: fetch reviews via `reviewService.getReviews(productId)`
- Display: average star rating + count, list of reviews (name, stars, body, date)
- If authenticated and no existing review: show `ReviewForm` (star selector + textarea + submit)
- If authenticated and already reviewed: show user's review highlighted
- Star selector: 5 clickable star icons, filled/outlined based on hover/selection

---

## Feature 3 — Coupon / Discount Codes

### Backend

**New model** `backend/src/models/Coupon.js`:
```js
{
  code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:           { type: String, enum: ['percentage', 'fixed'], required: true },
  value:          { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },   // in INR
  expiresAt:      { type: Date, default: null },
  isActive:       { type: Boolean, default: true },
  createdAt:      { type: Date, default: Date.now }
}
```

**New controller** `backend/src/controllers/couponController.js`:
- `listCoupons(req, res)` — GET /api/admin/coupons (adminOnly)
- `createCoupon(req, res)` — POST /api/admin/coupons (adminOnly)
- `updateCoupon(req, res)` — PUT /api/admin/coupons/:id (adminOnly)
- `deleteCoupon(req, res)` — DELETE /api/admin/coupons/:id (adminOnly)
- `validateCoupon(req, res)` — POST /api/coupons/validate (public) → `{ code, subtotal }` → returns `{ discount, discountedTotal }`

**New routes**:
- `backend/src/routes/adminCoupons.js` — admin CRUD, all protected by `protect + adminOnly`
- `backend/src/routes/coupons.js` — public validate endpoint

**Mount in** `backend/src/index.js`:
```js
app.use('/api/admin/coupons', adminCouponRoutes)
app.use('/api/coupons', couponRoutes)
```

### Frontend

**New service** `frontend/src/services/couponService.js`:
- `validateCoupon(code, subtotal)` → POST /api/coupons/validate
- `listCoupons()` → GET /api/admin/coupons
- `createCoupon(data)` → POST /api/admin/coupons
- `updateCoupon(id, data)` → PUT /api/admin/coupons/:id
- `deleteCoupon(id)` → DELETE /api/admin/coupons/:id

**Modify** `frontend/src/pages/checkout/ReviewStep.jsx`:
- Add coupon input section above the totals breakdown
- Input + "Apply" button → calls `validateCoupon(code, subtotal)`
- On success: show discount line item (negative INR), recalculate total
- On error: show inline error below input
- Pass `discount` and `couponCode` to `placeOrder` payload

**New admin page** `frontend/src/pages/admin/CouponsPage.jsx`:
- Table: code, type, value, min order, expiry, active status, actions
- "New Coupon" button → opens Modal with form
- Edit/Delete per row

**Modify** `frontend/src/router/index.jsx`: add `/admin/coupons` route

**Modify** `frontend/src/layouts/AdminLayout.jsx` or sidebar: add "Coupons" nav link

---

## Feature 4 — Order Tracking Timeline

### Frontend only

**New component** `frontend/src/components/ui/OrderTrackingTimeline.jsx`:

Props: `statusHistory: Array<{ status, timestamp, note? }>`, `currentStatus: string`

Renders a vertical timeline:
- Each entry = a node (circle) + connector line + label + timestamp + optional note
- Most recent entry: filled green circle; prior entries: outlined grey circles
- If `currentStatus === 'Delivered'`: last node shows ✅ green checkmark
- If `currentStatus === 'Cancelled'`: last node shows ❌ red cross
- Timestamp formatted with `new Date(ts).toLocaleString('en-IN')`

**Modify** `frontend/src/pages/account/OrderDetailPage.jsx`:
- Replace the existing plain `statusHistory` list with `<OrderTrackingTimeline />`

**Modify** `frontend/src/pages/admin/AdminOrderDetailPage.jsx` (if it exists):
- Same replacement

---

## Feature 5 — About / Contact / FAQ Pages

### Frontend only

**New pages**:
- `frontend/src/pages/user/AboutPage.jsx` — brand story, mission, farmer partnerships, green/cream theme
- `frontend/src/pages/user/ContactPage.jsx` — email, phone, non-functional contact form
- `frontend/src/pages/user/FAQPage.jsx` — accordion with 6+ Q&A items, no external library

**FAQ accordion**: local `openIndex` state, toggle on click, chevron icon rotates.

**Modify** `frontend/src/router/index.jsx`:
- Add lazy imports and routes under PublicLayout: `/about`, `/contact`, `/faq`

**Modify** `frontend/src/components/layout/Footer.jsx`:
- Add "Company" column with links to `/about`, `/contact`, `/faq`

**Modify** `frontend/src/components/layout/Navbar.jsx`:
- Add About/Contact links to mobile drawer

---

## Feature 6 — Admin Settings Page

### Backend

**Modify** `backend/src/controllers/settingsController.js`:
- Replace in-memory `db.settings` with Mongoose `Settings` model
- `getSettings`: `Settings.findOne({})` or return defaults
- `updateSettings`: `Settings.findOneAndUpdate({}, body, { upsert: true, new: true })`

**Modify** `backend/src/models/Settings.js` (if needed):
- Ensure fields: `taxRate`, `shippingCost`, `freeShippingThreshold`, `lowStockThreshold`, `storeName`, `storeEmail`, `storePhone`, `maintenanceMode`

### Frontend

**New page** `frontend/src/pages/admin/SettingsPage.jsx`:
- On mount: GET /api/settings → populate form
- Fields: taxRate (%), shippingCost (INR), freeShippingThreshold (INR), lowStockThreshold, storeName, storeEmail, storePhone, maintenanceMode (toggle)
- On submit: PUT /api/settings → success toast or inline error
- Loading spinner while fetching

**Modify** `frontend/src/router/index.jsx`: add `/admin/settings` route

**Modify admin sidebar** (AdminLayout or AdminSidebar component): add "Settings" link

---

## Feature 7 — Address Selection at Checkout

The `ShippingStep.jsx` already has a working saved-address selector. The feature is largely implemented. The remaining work is:

**Verify** `frontend/src/pages/checkout/ShippingStep.jsx`:
- Confirm saved addresses are pre-selected by default (first address)
- Confirm "Use a new address" clears the form
- Confirm the submit handler works for both saved and new address paths
- Fix the `handleSubmit` call on the "Continue to Payment" button for saved addresses (currently passes a fake event object)

**No backend changes needed** — addresses are already stored on the User model.

---

## Data Flow Summary

```
Wishlist:    Frontend → POST/DELETE /api/wishlist/:id → MongoDB Wishlist doc
Reviews:     Frontend → POST /api/reviews → MongoDB Review doc
             Frontend → GET /api/reviews?productId=x → list
Coupons:     Admin → POST /api/admin/coupons → MongoDB Coupon doc
             Customer → POST /api/coupons/validate → discount amount
Settings:    Admin → PUT /api/settings → MongoDB Settings doc
             Frontend → GET /api/settings → current config
Timeline:    Pure frontend — reads order.statusHistory from localStorage
Static pages: Pure frontend — no API calls
```

---

## File Change Summary

### New backend files
- `backend/src/models/Wishlist.js`
- `backend/src/models/Review.js`
- `backend/src/models/Coupon.js`
- `backend/src/controllers/wishlistController.js`
- `backend/src/controllers/reviewController.js`
- `backend/src/controllers/couponController.js`
- `backend/src/routes/wishlist.js`
- `backend/src/routes/reviews.js`
- `backend/src/routes/adminCoupons.js`
- `backend/src/routes/coupons.js`

### Modified backend files
- `backend/src/models/index.js` — export Wishlist, Review, Coupon
- `backend/src/index.js` — mount new routes
- `backend/src/controllers/settingsController.js` — use Mongoose Settings model
- `backend/src/models/Settings.js` — add storeName, storeEmail, storePhone, maintenanceMode fields

### New frontend files
- `frontend/src/services/wishlistService.js`
- `frontend/src/services/reviewService.js`
- `frontend/src/services/couponService.js`
- `frontend/src/contexts/WishlistContext.jsx`
- `frontend/src/components/ui/OrderTrackingTimeline.jsx`
- `frontend/src/pages/user/WishlistPage.jsx`
- `frontend/src/pages/user/AboutPage.jsx`
- `frontend/src/pages/user/ContactPage.jsx`
- `frontend/src/pages/user/FAQPage.jsx`
- `frontend/src/pages/admin/CouponsPage.jsx`
- `frontend/src/pages/admin/SettingsPage.jsx`

### Modified frontend files
- `frontend/src/contexts/index.js` — export useWishlist
- `frontend/src/contexts/AuthContext.jsx` — wrap with WishlistProvider or add to App
- `frontend/src/main.jsx` — add WishlistProvider
- `frontend/src/router/index.jsx` — add new routes
- `frontend/src/components/layout/Navbar.jsx` — wishlist icon, About/Contact links
- `frontend/src/components/layout/Footer.jsx` — Company column
- `frontend/src/components/product/ProductCard.jsx` — heart icon
- `frontend/src/pages/user/ProductDetailPage.jsx` — heart icon + reviews section
- `frontend/src/pages/account/OrderDetailPage.jsx` — OrderTrackingTimeline
- `frontend/src/pages/checkout/ReviewStep.jsx` — coupon input
- `frontend/src/layouts/AdminLayout.jsx` — Coupons + Settings sidebar links
