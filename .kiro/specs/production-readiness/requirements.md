# Requirements Document

## Introduction

This document specifies the requirements for making the Siddha Organics e-commerce application production-ready. The application currently uses an in-memory data store on the backend and localStorage on the frontend for products and orders. This feature migrates data persistence to MongoDB, connects the frontend to backend APIs, adds order confirmation emails, configures production build settings, and enables product image uploads for the admin panel.

## Glossary

- **Frontend**: The React 18 + Vite client application served to end users in the browser
- **Backend_API**: The Express.js server application that exposes REST endpoints under `/api/*`
- **Product_Service**: The frontend service module (`productService.js`) responsible for product data operations
- **Order_Service**: The frontend service module (`orderService.js`) responsible for order data operations
- **Cart_Service**: The frontend service module (`cartService.js`) responsible for cart data operations using localStorage
- **Product_Controller**: The backend controller (`productController.js`) handling product CRUD operations
- **Order_Controller**: The backend controller (`orderController.js`) handling order placement and management
- **Email_Service**: The backend service (`emailService.js`) using Nodemailer to send transactional emails
- **MongoDB**: The MongoDB Atlas database used for persistent data storage
- **Product_Model**: The Mongoose schema/model defining the product document structure in MongoDB
- **Order_Model**: The Mongoose schema/model defining the order document structure in MongoDB
- **In_Memory_Store**: The current `store.js` module that holds products and orders in server memory
- **Admin**: An authenticated user with the `admin` role who manages products and orders
- **Customer**: An authenticated user with a standard role who browses products and places orders
- **Base64_Image**: A product image encoded as a base64 data URL string stored in the database

## Requirements

### Requirement 1: Migrate Product Controller to MongoDB

**User Story:** As a developer, I want the backend product controller to use the Mongoose Product_Model instead of the In_Memory_Store, so that product data persists across server restarts.

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/products`, THE Product_Controller SHALL query the Product_Model in MongoDB and return the results
2. WHEN a GET request is received at `/api/products/:id`, THE Product_Controller SHALL query the Product_Model by ID or slug and return the matching document
3. WHEN a POST request is received at `/api/products` with a valid payload, THE Product_Controller SHALL create a new document in the Product_Model and return the created product with HTTP status 201
4. WHEN a PUT request is received at `/api/products/:id` with a valid payload, THE Product_Controller SHALL update the matching document in the Product_Model and return the updated product
5. WHEN a DELETE request is received at `/api/products/:id`, THE Product_Controller SHALL remove the matching document from the Product_Model and return a success message
6. WHEN a PATCH request is received at `/api/products/:id/stock` with a valid variantId and stock value, THE Product_Controller SHALL update the variant stock in the Product_Model and return the updated product
7. IF a database operation fails, THEN THE Product_Controller SHALL return an appropriate HTTP error status with a descriptive error message

### Requirement 2: Migrate Order Controller to MongoDB

**User Story:** As a developer, I want the backend order controller to use the Mongoose Order_Model instead of the In_Memory_Store, so that order data persists across server restarts.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/orders` with a valid order payload, THE Order_Controller SHALL create a new document in the Order_Model, decrement product variant stock in the Product_Model, and return the created order with HTTP status 201
2. WHEN a GET request is received at `/api/orders/my`, THE Order_Controller SHALL query the Order_Model for orders belonging to the authenticated user and return the results
3. WHEN a GET request is received at `/api/orders/:id`, THE Order_Controller SHALL query the Order_Model by ID and return the order if the user owns it or is an Admin
4. WHEN a GET request is received at `/api/orders` by an Admin, THE Order_Controller SHALL query the Order_Model with optional filters (status, dateFrom, dateTo, paymentMethod) and return the results
5. WHEN a PATCH request is received at `/api/orders/:id/status` with a valid status, THE Order_Controller SHALL update the order status in the Order_Model and append to the statusHistory array
6. WHEN a POST request is received at `/api/orders/:id/cancel`, THE Order_Controller SHALL set the order status to Cancelled, restore variant stock in the Product_Model, and return the updated order
7. IF a database operation fails, THEN THE Order_Controller SHALL return an appropriate HTTP error status with a descriptive error message

### Requirement 3: Connect Frontend Product Service to Backend API

**User Story:** As a developer, I want the frontend Product_Service to fetch product data from the Backend_API instead of localStorage, so that all users see the same product catalog managed from a single source of truth.

#### Acceptance Criteria

1. WHEN the Product_Service initializes, THE Product_Service SHALL fetch products from `GET /api/products` on the Backend_API
2. WHEN a single product is requested by ID or slug, THE Product_Service SHALL fetch it from `GET /api/products/:id` on the Backend_API
3. WHEN an Admin creates a product, THE Product_Service SHALL send a POST request to `/api/products` on the Backend_API and return the created product
4. WHEN an Admin updates a product, THE Product_Service SHALL send a PUT request to `/api/products/:id` on the Backend_API and return the updated product
5. WHEN an Admin deletes a product, THE Product_Service SHALL send a DELETE request to `/api/products/:id` on the Backend_API
6. IF the Backend_API returns an error response, THEN THE Product_Service SHALL propagate the error message to the calling component for display to the user
7. THE Product_Service SHALL include the authentication token in the Authorization header for Admin write operations

### Requirement 4: Connect Frontend Order Service to Backend API

**User Story:** As a developer, I want the frontend Order_Service to communicate with the Backend_API for order operations, so that orders are processed server-side and persisted in MongoDB.

#### Acceptance Criteria

1. WHEN a Customer places an order, THE Order_Service SHALL send a POST request to `/api/orders` on the Backend_API with cart items, shipping address, and payment details
2. WHEN a Customer requests their order history, THE Order_Service SHALL fetch orders from `GET /api/orders/my` on the Backend_API
3. WHEN a Customer or Admin requests a specific order, THE Order_Service SHALL fetch it from `GET /api/orders/:id` on the Backend_API
4. WHEN an Admin updates an order status, THE Order_Service SHALL send a PATCH request to `/api/orders/:id/status` on the Backend_API
5. WHEN a Customer or Admin cancels an order, THE Order_Service SHALL send a POST request to `/api/orders/:id/cancel` on the Backend_API
6. THE Order_Service SHALL include the authentication token in the Authorization header for all requests
7. IF the Backend_API returns an error response, THEN THE Order_Service SHALL propagate the error message to the calling component for display to the user

### Requirement 5: Retain Cart in localStorage with Backend Order Submission

**User Story:** As a Customer, I want my shopping cart to persist locally in the browser for fast access, while ensuring that placing an order submits it to the server.

#### Acceptance Criteria

1. THE Cart_Service SHALL continue to store cart items in localStorage under the key `siddha_cart_{userId}`
2. WHEN a Customer places an order, THE Cart_Service SHALL clear the local cart only after the Backend_API confirms successful order creation
3. IF the order submission to the Backend_API fails, THEN THE Cart_Service SHALL retain the cart contents in localStorage unchanged

### Requirement 6: Order Confirmation Email

**User Story:** As a Customer, I want to receive a confirmation email after placing an order, so that I have a record of my purchase details.

#### Acceptance Criteria

1. WHEN an order is successfully created in the Order_Model, THE Email_Service SHALL send a confirmation email to the Customer email address associated with the order
2. THE Email_Service SHALL include the order ID, ordered items with product names and quantities, order total amount, shipping address, and estimated delivery date in the confirmation email
3. THE Email_Service SHALL use the Siddha Organics brand styling consistent with the existing OTP email template
4. IF the confirmation email fails to send, THEN THE Backend_API SHALL log the failure and continue without failing the order creation response
5. THE Email_Service SHALL use the sender address configured in the EMAIL_USER environment variable

### Requirement 7: Product Image Upload

**User Story:** As an Admin, I want to upload product images directly instead of providing external URLs, so that I have full control over product imagery without depending on third-party hosting.

#### Acceptance Criteria

1. WHEN an Admin creates or updates a product with uploaded image files, THE Backend_API SHALL accept base64-encoded image data in the product images array
2. THE Backend_API SHALL accept image payloads up to 10MB in total request body size
3. THE Frontend SHALL provide a file input that converts selected image files to base64 data URLs before including them in the product create/update request
4. THE Frontend SHALL display a preview of selected images before submission
5. THE Frontend SHALL validate that uploaded files are image types (JPEG, PNG, WebP) before encoding
6. IF an uploaded file exceeds 5MB individually, THEN THE Frontend SHALL display a validation error and reject the file

### Requirement 8: Environment-Based Configuration

**User Story:** As a developer, I want environment-specific configuration for API URLs and CORS origins, so that the application works correctly in development and production environments.

#### Acceptance Criteria

1. THE Frontend SHALL read the Backend_API base URL from the `VITE_API_URL` environment variable for all API requests
2. THE Backend_API SHALL read allowed CORS origins from the `FRONTEND_URL` environment variable in addition to localhost development origins
3. WHILE the application is running in production mode, THE Backend_API SHALL restrict CORS to only the configured `FRONTEND_URL` origin
4. WHILE the application is running in development mode, THE Backend_API SHALL allow CORS from localhost origins on ports 5173, 5174, and 5175

### Requirement 9: Production Build Optimization

**User Story:** As a developer, I want the frontend to be optimized for production deployment, so that users get fast load times and proper SEO metadata.

#### Acceptance Criteria

1. THE Frontend SHALL include Open Graph meta tags (og:title, og:description, og:image, og:url) in the HTML document head
2. THE Frontend SHALL include a descriptive meta description tag for search engine indexing
3. THE Frontend SHALL use a custom favicon representing the Siddha Organics brand instead of the default Vite favicon
4. THE Frontend Vite configuration SHALL enable code splitting for vendor libraries to optimize caching
5. THE Frontend Vite configuration SHALL generate production builds with minified JavaScript and CSS

### Requirement 10: Backend Error Handling and Resilience

**User Story:** As a developer, I want consistent error handling across all backend API endpoints, so that the frontend receives predictable error responses and failures are logged.

#### Acceptance Criteria

1. WHEN an unhandled error occurs in any API route handler, THE Backend_API SHALL catch the error, log the stack trace to the server console, and return a JSON response with HTTP status 500 and a generic error message
2. WHEN a Mongoose validation error occurs, THE Backend_API SHALL return HTTP status 400 with the specific validation error messages
3. WHEN a request targets a non-existent resource, THE Backend_API SHALL return HTTP status 404 with a descriptive error message
4. THE Backend_API SHALL return all error responses in a consistent JSON format: `{ "error": "<message>" }`

### Requirement 11: Seed Product Data Migration

**User Story:** As a developer, I want the seed product data currently in the In_Memory_Store to be available in MongoDB, so that the application has initial product data after migration.

#### Acceptance Criteria

1. WHEN the Backend_API starts and the Product_Model collection is empty, THE Backend_API SHALL insert the seed product data into MongoDB
2. WHEN the Backend_API starts and the Product_Model collection already contains products, THE Backend_API SHALL skip seeding to avoid duplicate entries
3. THE seed data inserted into MongoDB SHALL match the product structure defined in the Product_Model schema including all variant fields
