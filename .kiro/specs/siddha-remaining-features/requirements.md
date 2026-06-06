# Requirements Document

## Introduction

This document covers seven remaining features for the Siddha Organics e-commerce platform: Wishlist, Product Reviews & Ratings, Coupon / Discount Codes, Order Tracking Timeline, About / Contact / FAQ static pages, Admin Settings Page, and Address Selection at Checkout. The platform is built with React 18 + React Router v6 + Tailwind CSS on the frontend and Express + MongoDB/Mongoose on the backend. All monetary values are in INR (rupees). New MongoDB models (Review, Wishlist, Coupon) will be added alongside the existing User, Order, Product, Settings, and OtpRecord models.

---

## Glossary

- **WishlistService**: The backend Express API responsible for managing per-user wishlist documents in MongoDB.
- **Wishlist**: A MongoDB document that stores a list of product references for a single authenticated user.
- **ReviewService**: The backend Express API responsible for managing product review documents in MongoDB.
- **Review**: A MongoDB document containing a star rating (1–5), a text body, and a reference to the authoring user and reviewed product.
- **CouponService**: The backend Express API responsible for managing coupon documents in MongoDB.
- **Coupon**: A MongoDB document representing a discount code with a type (percentage or fixed), a value, optional minimum order amount, optional expiry date, and an active flag.
- **OrderTrackingTimeline**: The frontend React component that renders a vertical visual timeline of an order's `statusHistory` array.
- **StatusHistory**: The array of `{ status, timestamp, note }` sub-documents embedded in an Order document.
- **ShippingStep**: The existing React checkout component that collects or selects a delivery address.
- **AdminSettingsPage**: The React admin page that reads from and writes to the `/api/settings` endpoint.
- **StaticPage**: A frontend-only React page with no backend dependency (About, Contact, FAQ).
- **CheckoutSummary**: The frontend component that displays the order total, tax, shipping, and any applied discount during checkout.
- **AuthMiddleware**: The existing Express middleware that validates the JWT and attaches the authenticated user to `req.user`.

---

## Requirements

### Requirement 1 — Wishlist

**User Story:** As a logged-in customer, I want to save products to a wishlist, so that I can return to them later without searching again.

#### Acceptance Criteria

1. WHEN an authenticated user sends `POST /api/wishlist/:productId`, THE WishlistService SHALL add the product to that user's Wishlist document, creating the document if it does not yet exist.
2. WHEN an authenticated user sends `DELETE /api/wishlist/:productId`, THE WishlistService SHALL remove the specified product from that user's Wishlist document.
3. WHEN an authenticated user sends `GET /api/wishlist`, THE WishlistService SHALL return the full list of product references stored in that user's Wishlist document.
4. IF a product is already present in the user's Wishlist and the user sends `POST /api/wishlist/:productId`, THEN THE WishlistService SHALL return a 409 Conflict response without creating a duplicate entry.
5. IF an unauthenticated request is made to any `/api/wishlist` route, THEN THE AuthMiddleware SHALL return a 401 Unauthorized response.
6. WHEN a user views a product detail page, THE WishlistPage component SHALL display a filled heart icon for products already in the wishlist and an outlined heart icon for products not in the wishlist.
7. WHEN a user clicks the wishlist toggle on a product card or product detail page, THE WishlistPage component SHALL optimistically update the icon state and then call the corresponding WishlistService API route.
8. THE WishlistService SHALL store the Wishlist as a single MongoDB document per user, referencing products by their ObjectId.

---

### Requirement 2 — Product Reviews & Ratings

**User Story:** As a logged-in customer, I want to submit a star rating and written review for any product, so that other shoppers can make informed purchase decisions.

#### Acceptance Criteria

1. WHEN an authenticated user submits `POST /api/reviews` with a valid `productId`, `rating` (integer 1–5), and `body` (non-empty string), THE ReviewService SHALL create a new Review document in MongoDB and return it with HTTP 201.
2. WHEN a user sends `GET /api/reviews?productId=:id`, THE ReviewService SHALL return all Review documents for that product, sorted by `createdAt` descending.
3. IF an authenticated user has already submitted a review for a product and submits `POST /api/reviews` for the same product again, THEN THE ReviewService SHALL return a 409 Conflict response.
4. IF the `rating` field is outside the range 1–5 or the `body` field is empty, THEN THE ReviewService SHALL return a 422 Unprocessable Entity response with a field-level error message.
5. IF an unauthenticated request is made to `POST /api/reviews`, THEN THE AuthMiddleware SHALL return a 401 Unauthorized response.
6. WHEN a product detail page loads, THE ProductDetailPage component SHALL fetch and display all reviews for that product, showing the reviewer's name, star rating, review body, and submission date.
7. WHEN a product detail page loads, THE ProductDetailPage component SHALL display the average star rating and total review count for the product, calculated from the fetched reviews.
8. WHEN an authenticated user has not yet reviewed a product, THE ProductDetailPage component SHALL display a review submission form with a 1–5 star selector and a text area.
9. WHEN an authenticated user has already reviewed a product, THE ProductDetailPage component SHALL hide the submission form and display the user's existing review.
10. THE ReviewService SHALL store each Review as a separate MongoDB document with fields: `productId` (ObjectId ref), `userId` (ObjectId ref), `rating` (Number 1–5), `body` (String), and `createdAt` (Date).

---

### Requirement 3 — Coupon / Discount Codes

**User Story:** As an admin, I want to create and manage discount coupon codes, and as a customer, I want to apply a coupon at checkout to receive a discount on my order.

#### Acceptance Criteria

1. THE CouponService SHALL expose `GET /api/admin/coupons` (list all), `POST /api/admin/coupons` (create), `PUT /api/admin/coupons/:id` (update), and `DELETE /api/admin/coupons/:id` (delete) routes, all protected by admin-role AuthMiddleware.
2. WHEN an admin creates a coupon via `POST /api/admin/coupons`, THE CouponService SHALL require a unique `code` (string, case-insensitive), a `type` of either `"percentage"` or `"fixed"`, a `value` (positive number), and an `isActive` boolean.
3. WHERE a coupon has a `minOrderAmount` field set, THE CouponService SHALL reject coupon application requests where the order subtotal in INR is less than `minOrderAmount`.
4. WHERE a coupon has an `expiresAt` field set, THE CouponService SHALL reject coupon application requests made after the `expiresAt` date.
5. WHEN a customer sends `POST /api/coupons/validate` with a `code` and `subtotal`, THE CouponService SHALL return the discount amount in INR if the coupon is valid and active.
6. IF the coupon `code` does not exist or `isActive` is false, THEN THE CouponService SHALL return a 404 response with an error message.
7. WHEN a customer enters a coupon code in the CheckoutSummary component and clicks "Apply", THE CheckoutSummary SHALL call `POST /api/coupons/validate` and display the discount amount and updated order total in INR.
8. IF the coupon validation API returns an error, THEN THE CheckoutSummary SHALL display the error message inline below the coupon input field.
9. WHEN a coupon is successfully applied, THE CheckoutSummary SHALL display a line item showing the discount amount as a negative value in INR and recalculate the displayed total.
10. THE CouponService SHALL store each Coupon as a MongoDB document with fields: `code` (String, unique, uppercase), `type` (`"percentage"` | `"fixed"`), `value` (Number), `minOrderAmount` (Number, optional), `expiresAt` (Date, optional), and `isActive` (Boolean, default true).
11. THE admin Coupons page SHALL display a table of all coupons with columns for code, type, value, minimum order, expiry, and active status, and SHALL provide buttons to create, edit, and delete coupons.

---

### Requirement 4 — Order Tracking Timeline

**User Story:** As a customer, I want to see a visual timeline of my order's status history, so that I can understand exactly where my order is in the fulfilment process.

#### Acceptance Criteria

1. WHEN a customer views the OrderDetailPage for an order, THE OrderTrackingTimeline component SHALL render a vertical timeline with one node per entry in the order's `statusHistory` array.
2. WHEN rendering the timeline, THE OrderTrackingTimeline component SHALL display the `status` label, the `timestamp` formatted as a human-readable date and time in the `en-IN` locale, and the `note` text (if present) for each history entry.
3. WHEN rendering the timeline, THE OrderTrackingTimeline component SHALL visually distinguish the most recent status entry from earlier entries using a filled green circle for the most recent node and outlined grey circles for prior nodes.
4. WHEN the order `status` is `"Delivered"`, THE OrderTrackingTimeline component SHALL display a green checkmark icon on the final timeline node.
5. WHEN the order `status` is `"Cancelled"`, THE OrderTrackingTimeline component SHALL display a red cross icon on the final timeline node.
6. THE OrderTrackingTimeline component SHALL be rendered within the existing OrderDetailPage below the "Status History" heading, replacing the current plain list rendering.

---

### Requirement 5 — About / Contact / FAQ Pages

**User Story:** As a site visitor, I want to read information about the company, contact the team, and find answers to common questions, so that I can trust the brand and resolve queries without contacting support.

#### Acceptance Criteria

1. THE frontend router SHALL register routes `/about`, `/contact`, and `/faq` that each render a dedicated static React page component.
2. WHEN a user navigates to `/about`, THE AboutPage component SHALL display the brand story, founding year, mission statement, and farmer partnership information using the existing green/cream/brown Tailwind colour palette.
3. WHEN a user navigates to `/contact`, THE ContactPage component SHALL display the store email address, phone number, and a non-functional contact form with fields for name, email, and message, styled consistently with the rest of the site.
4. WHEN a user navigates to `/faq`, THE FAQPage component SHALL display a list of at least five frequently asked questions with expandable answer sections (accordion behaviour) implemented without external UI libraries.
5. THE Navbar component SHALL include navigation links to `/about`, `/contact`, and `/faq` in the site footer or header navigation.

---

### Requirement 6 — Admin Settings Page

**User Story:** As an admin, I want a dedicated settings page in the admin panel where I can view and update store-wide configuration, so that I can manage tax rates, shipping costs, and store details without editing code.

#### Acceptance Criteria

1. WHEN an admin navigates to the admin settings route, THE AdminSettingsPage component SHALL fetch the current settings by calling `GET /api/settings` and pre-populate all form fields with the returned values.
2. THE AdminSettingsPage component SHALL display editable fields for: `taxRate` (displayed as a percentage, e.g. 18 for 18%), `shippingCost` (in INR), `freeShippingThreshold` (in INR), `lowStockThreshold` (integer), `storeName`, `storeEmail`, `storePhone`, and `maintenanceMode` (toggle).
3. WHEN an admin submits the settings form, THE AdminSettingsPage component SHALL call `PUT /api/settings` with the updated values and display a success notification on a 200 response.
4. IF the `PUT /api/settings` call returns an error, THEN THE AdminSettingsPage component SHALL display an inline error message without navigating away from the page.
5. WHEN the AdminSettingsPage converts `shippingCost` and `freeShippingThreshold` for display, THE AdminSettingsPage component SHALL divide the stored paise values by 100 to show INR, and SHALL multiply by 100 before sending to the API.
6. THE AdminSidebar component SHALL include a "Settings" navigation link pointing to the admin settings route.
7. WHILE the settings data is loading, THE AdminSettingsPage component SHALL display a loading spinner in place of the form.

---

### Requirement 7 — Address Selection at Checkout

**User Story:** As a logged-in customer with saved addresses, I want to select a previously saved address during checkout, so that I do not have to re-enter my delivery details on every order.

#### Acceptance Criteria

1. WHEN a logged-in user with at least one saved address reaches the ShippingStep, THE ShippingStep component SHALL display all saved addresses as selectable radio-button cards before the manual entry form.
2. WHEN a user selects a saved address card, THE ShippingStep component SHALL populate the shipping form fields with the selected address data and hide the manual entry form.
3. WHEN a user selects the "Use a new address" option, THE ShippingStep component SHALL display the empty manual entry form and clear any previously populated field values.
4. WHEN a logged-in user has no saved addresses, THE ShippingStep component SHALL display only the manual entry form without the saved address selection section.
5. WHEN a user with saved addresses reaches the ShippingStep, THE ShippingStep component SHALL pre-select the first address in the user's `addresses` array as the default selection.
6. IF the user is not logged in, THE ShippingStep component SHALL display only the manual entry form without a saved address selection section.
7. WHEN a user submits the ShippingStep with a selected saved address, THE ShippingStep component SHALL pass the address data to the `onComplete` callback in the same shape as a manually entered address.
