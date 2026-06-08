/**
 * Siddha Organics — Backend API Server
 * Entry point: starts Express server and mounts all routes
 *
 * IMPORTANT: 'dotenv/config' must be the FIRST import so env vars
 * are available before any other module reads process.env.
 */

import 'dotenv/config'

import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import userRoutes from './routes/users.js'
import settingsRoutes from './routes/settings.js'
import otpRoutes from './routes/otp.js'
import wishlistRoutes from './routes/wishlist.js'
import reviewRoutes from './routes/reviews.js'
import adminCouponRoutes from './routes/adminCoupons.js'
import couponRoutes from './routes/coupons.js'
import connectDB from './config/db.js'
import { User, Product } from './models/index.js'

// Connect to MongoDB Atlas
await connectDB()

// Seed admin if not exists
const adminExists = await User.findOne({ role: 'admin' })
if (!adminExists) {
  await User.create({
    fullName: 'Siddha Admin',
    email: 'admin@siddhaorganics.com',
    phone: '9876543210',
    passwordHash: 'Admin@123', // pre-save hook will hash
    role: 'admin',
    status: 'active',
    emailVerified: true,
    phoneVerified: true,
  })
  console.log('✅ Admin user seeded')
}

// Seed products if collection is empty
const productCount = await Product.countDocuments()
if (productCount === 0) {
  const { db } = await import('./data/store.js')
  const seedProducts = db.products.map((p) => {
    const { id, ...rest } = p
    return rest
  })
  await Product.insertMany(seedProducts)
  console.log(`✅ ${seedProducts.length} products seeded`)
}

const app = express()
const PORT = process.env.PORT || 5000

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
}))

app.use(express.json({ limit: '10mb' })) // 10mb for base64 images
app.use(express.urlencoded({ extended: true }))

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/otp', otpRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/admin/coupons', adminCouponRoutes)
app.use('/api/coupons', couponRoutes)

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Siddha Organics API is running' })
})

// ─── Keep-alive (prevents Render free tier from sleeping) ─────────────────────

if (process.env.NODE_ENV === 'production') {
  const SELF_URL = `https://siddha-organics.onrender.com/api/health`
  setInterval(async () => {
    try {
      await fetch(SELF_URL)
    } catch {
      // silently ignore ping failures
    }
  }, 14 * 60 * 1000) // Ping every 14 minutes (Render sleeps after 15 min)
}

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Start server ─────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`✅ Siddha Organics API running at http://localhost:${PORT}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Kill the process using it or change PORT in .env`)
    process.exit(1)
  } else {
    throw err
  }
})
