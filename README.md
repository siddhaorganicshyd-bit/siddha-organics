# Siddha Organics Ecommerce

A full-stack ecommerce platform for Siddha Organics — premium organic products.

---

## Project Structure

```
siddha-organics/
├── frontend/          ← React 18 + Vite + Tailwind CSS (customer & admin UI)
│   ├── src/
│   │   ├── components/    ← Reusable UI components (Button, Modal, etc.)
│   │   ├── contexts/      ← React Context providers (Auth, Cart, Products, Orders)
│   │   ├── data/          ← Seed data (products, admin, settings)
│   │   ├── hooks/         ← Custom React hooks (useToast)
│   │   ├── layouts/       ← Page layouts (PublicLayout, AdminLayout, etc.)
│   │   ├── pages/         ← All page components
│   │   │   ├── user/      ← Customer pages (Home, Shop, Cart, Checkout, etc.)
│   │   │   ├── account/   ← Account pages (Profile, Orders, Addresses)
│   │   │   ├── admin/     ← Admin pages (Dashboard, Products, Orders, Users)
│   │   │   └── checkout/  ← Checkout flow (Shipping, Payment, Review)
│   │   ├── router/        ← React Router config + Protected routes
│   │   ├── services/      ← Business logic (auth, products, cart, orders, payment)
│   │   ├── types/         ← TypeScript type definitions
│   │   └── utils/         ← Helper functions (formatCurrency, validators, etc.)
│   ├── public/            ← Static assets (logo, images)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/           ← Node.js + Express REST API
│   ├── src/
│   │   ├── controllers/   ← Request handlers (auth, products, orders, users)
│   │   ├── middleware/     ← JWT auth middleware
│   │   ├── routes/        ← Express route definitions
│   │   └── data/          ← In-memory store (replace with DB in production)
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Getting Started

### 1. Install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
# Edit .env and set JWT_SECRET
```

### 3. Run both servers

**Frontend** (runs on http://localhost:5173):
```bash
cd frontend
npm run dev
```

**Backend** (runs on http://localhost:5000):
```bash
cd backend
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/login/admin` | Admin login | Public |
| GET | `/api/auth/me` | Get current user | User |
| GET | `/api/products` | List products | Public |
| GET | `/api/products/:id` | Get product | Public |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |
| PATCH | `/api/products/:id/stock` | Update stock | Admin |
| POST | `/api/orders` | Place order | User |
| GET | `/api/orders/my` | My orders | User |
| GET | `/api/orders/:id` | Get order | User/Admin |
| GET | `/api/orders` | All orders | Admin |
| PATCH | `/api/orders/:id/status` | Update status | Admin |
| POST | `/api/orders/:id/cancel` | Cancel order | User/Admin |
| GET | `/api/users` | List users | Admin |
| PATCH | `/api/users/:id/suspend` | Suspend user | Admin |
| PATCH | `/api/users/:id/reactivate` | Reactivate user | Admin |
| GET | `/api/settings` | Get settings | Public |
| PUT | `/api/settings` | Update settings | Admin |

---

## Default Admin Credentials

```
Email:    admin@siddhaorganics.com
Password: Admin@123
```

---

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Context API + useReducer

**Backend**
- Node.js + Express
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- In-memory store (swap with MongoDB/PostgreSQL for production)
