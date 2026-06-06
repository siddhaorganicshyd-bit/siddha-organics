/**
 * MongoDB connection using Mongoose.
 * Forces Google DNS (8.8.8.8) to resolve Atlas SRV records,
 * bypassing ISP DNS that may block the lookup.
 */

import dns from 'dns'
import mongoose from 'mongoose'

// Force Node.js to use Google DNS — fixes querySrv ECONNREFUSED on restrictive networks
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])

export default async function connectDB() {
  const uri = process.env.DB_URL

  if (!uri) {
    console.error('❌ DB_URL not set in .env')
    process.exit(1)
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    })
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`)
    console.log(`📦 Database: ${mongoose.connection.name}`)
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`)
    process.exit(1)
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. Reconnecting...')
  })
  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected')
  })
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message)
  })
}
