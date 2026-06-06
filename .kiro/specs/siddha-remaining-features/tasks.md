# Implementation Plan — Siddha Organics: Remaining Features

## Tasks

- [x] 1. Backend — Wishlist model, controller, and routes
  - Create `backend/src/models/Wishlist.js` with userId (unique), productIds[], updatedAt
  - Create `backend/src/controllers/wishlistController.js` with getWishlist, addToWishlist, removeFromWishlist
  - Create `backend/src/routes/wishlist.js` — all routes protected with `protect` middleware
  - Export Wishlist from `backend/src/models/index.js`
  - Mount `/api/wishlist` in `backend/src/index.js`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8_

- [x] 2. Backend — Review model, controller, and routes
  - Create `backend/src/models/Review.js` with productId (string), userId (ObjectId ref), rating (1-5), body, createdAt; compound unique index on {productId, userId}
  - Create `backend/src/controllers/reviewController.js` with getReviews (public, sorted desc) and createReview (protect, 409 on duplicate, 422 on invalid)
  - Create `backend/src/routes/reviews.js` — GET public, POST protected
  - Export Review from `backend/src/models/index.js`
  - Mount `/api/reviews` in `backend/src/index.js`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.10_

- [x] 3. Backend — Coupon model, controller, and routes
  - Create `backend/src/models/Coupon.js` with code (unique, uppercase), type (percentage|fixed), value, minOrderAmount, expiresAt, isActive
  - Create `backend/src/controllers/couponController.js` with listCoupons, createCoupon, updateCoupon, deleteCoupon (all adminOnly) and validateCoupon (public — checks active, expiry, minOrderAmount, returns discount amount)
  - Create `backend/src/routes/adminCoupons.js` — all routes protected with `protect + adminOnly`
  - Create `backend/src/routes/coupons.js` — POST /validate (public)
  - Export Coupon from `backend/src/models/index.js`
  - Mount `/api/admin/coupons` and `/api/coupons` in `backend/src/index.js`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.10_

- [x] 4. Backend — Migrate settingsController to use Mongoose Settings model
  - Update `backend/src/models/Settings.js` to add fields: storeName, storeEmail, storePhone, maintenanceMode (Boolean, default false)
  - Rewrite `backend/src/controllers/settingsController.js` to use `Settings.findOne({})` for GET and `Settings.findOneAndUpdate({}, body, { upsert: true, new: true })` for PUT
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5. Frontend — Wishlist service and context
  - Create `frontend/src/services/wishlistService.js` with getWishlist(), addToWishlist(productId), removeFromWishlist(productId) — all use JWT from localStorage
  - Create `frontend/src/contexts/WishlistContext.jsx` with wishlistIds (Set), loading, toggleWishlist(productId), isWishlisted(productId); fetch on mount if authenticated
  - Export `useWishlist` from `frontend/src/contexts/index.js`
  - Add `WishlistProvider` to `frontend/src/main.jsx` wrapping the app
  - _Requirements: 1.6, 1.7_

- [x] 6. Frontend — Heart icon on ProductCard and ProductDetailPage
  - Modify `frontend/src/components/product/ProductCard.jsx` — add heart button (top-right overlay), filled if wishlisted, outlined if not; calls toggleWishlist; shows nothing if unauthenticated (or prompts login)
  - Modify `frontend/src/pages/user/ProductDetailPage.jsx` — add heart icon button near product title with same toggle behaviour
  - _Requirements: 1.6, 1.7_

- [x] 7. Frontend — WishlistPage
  - Create `frontend/src/pages/user/WishlistPage.jsx` — protected route at `/wishlist`
  - Fetch wishlist IDs from WishlistContext, look up products from ProductContext
  - Render product grid with remove button on each card
  - Empty state: "Your wishlist is empty" with "Browse Shop" CTA
  - Add lazy import and protected route in `frontend/src/router/index.jsx`
  - Add wishlist icon (🤍) with count badge to Navbar
  - _Requirements: 1.3, 1.6_

- [x] 8. Frontend — Reviews section on ProductDetailPage
  - Create `frontend/src/services/reviewService.js` with getReviews(productId) and createReview(productId, rating, body)
  - Modify `frontend/src/pages/user/ProductDetailPage.jsx` — add ReviewsSection at bottom:
    - Fetch reviews on mount; display average star rating + count
    - List reviews: reviewer name, star display, body, formatted date
    - If authenticated and no existing review: show ReviewForm (5-star selector + textarea + submit button)
    - If authenticated and already reviewed: show user's review highlighted, hide form
    - Star selector: 5 clickable star icons, filled/outlined on hover and selection
  - _Requirements: 2.6, 2.7, 2.8, 2.9_

- [x] 9. Frontend — Coupon input in checkout ReviewStep
  - Create `frontend/src/services/couponService.js` with validateCoupon(code, subtotal), listCoupons(), createCoupon(data), updateCoupon(id, data), deleteCoupon(id)
  - Modify `frontend/src/pages/checkout/ReviewStep.jsx` — add coupon section above totals:
    - Text input + "Apply" button
    - On success: show discount line item (negative INR value), recalculate displayed total
    - On error: show inline error message below input
    - "Remove" link to clear applied coupon
  - _Requirements: 3.7, 3.8, 3.9_

- [x] 10. Frontend — Admin Coupons page
  - Create `frontend/src/pages/admin/CouponsPage.jsx`:
    - Table with columns: code, type, value, min order (INR), expiry, active status, actions
    - "New Coupon" button opens Modal with form (code, type, value, minOrderAmount, expiresAt, isActive)
    - Edit button per row opens same Modal pre-filled
    - Delete button per row with confirmation
    - Uses couponService for all API calls
  - Add lazy import and `/admin/coupons` route in `frontend/src/router/index.jsx`
  - Add "Coupons" link to admin sidebar in `frontend/src/layouts/AdminLayout.jsx`
  - _Requirements: 3.1, 3.11_

- [x] 11. Frontend — OrderTrackingTimeline component
  - Create `frontend/src/components/ui/OrderTrackingTimeline.jsx`:
    - Props: statusHistory[], currentStatus
    - Vertical timeline: filled green circle for most recent, outlined grey for prior
    - Each node: status label, timestamp (en-IN locale), optional note
    - Delivered status: green ✅ on last node; Cancelled: red ❌ on last node
    - Connector lines between nodes
  - Modify `frontend/src/pages/account/OrderDetailPage.jsx` — replace plain statusHistory list with `<OrderTrackingTimeline />`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 12. Frontend — About, Contact, FAQ static pages
  - Create `frontend/src/pages/user/AboutPage.jsx` — brand story, founding year, mission, farmer partnerships; green/cream/brown theme; hero section + content sections
  - Create `frontend/src/pages/user/ContactPage.jsx` — store email, phone, non-functional contact form (name, email, message fields); styled consistently
  - Create `frontend/src/pages/user/FAQPage.jsx` — accordion with 6+ Q&A items; local openIndex state; chevron rotates on open; no external libraries
  - Add lazy imports and routes `/about`, `/contact`, `/faq` under PublicLayout in `frontend/src/router/index.jsx`
  - Modify `frontend/src/components/layout/Footer.jsx` — add "Company" column with links to /about, /contact, /faq
  - Modify `frontend/src/components/layout/Navbar.jsx` — add About/Contact links to mobile drawer
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13. Frontend — Admin Settings page
  - Create `frontend/src/pages/admin/SettingsPage.jsx`:
    - On mount: GET /api/settings → populate form fields
    - Fields: taxRate (%), shippingCost (INR — divide stored paise by 100), freeShippingThreshold (INR), lowStockThreshold, storeName, storeEmail, storePhone, maintenanceMode (toggle)
    - On submit: multiply shippingCost and freeShippingThreshold by 100 before PUT /api/settings
    - Success toast on 200; inline error on failure
    - Loading spinner while fetching
  - Add lazy import and `/admin/settings` route in `frontend/src/router/index.jsx`
  - Add "Settings" link to admin sidebar in `frontend/src/layouts/AdminLayout.jsx`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 14. Final integration — verify all routes, links, and providers
  - Verify WishlistProvider is in the provider tree in `frontend/src/main.jsx`
  - Verify all new routes are registered in `frontend/src/router/index.jsx`
  - Verify all new admin sidebar links are present
  - Verify Footer has Company column with About/Contact/FAQ links
  - Verify Navbar has wishlist icon
  - Run frontend build to confirm no import errors
