/**
 * One-time script to delete a user by email from MongoDB.
 * Usage: node scripts/deleteUser.js vadlamudibrahmaiah02@gmail.com
 */

import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'
import { User } from '../src/models/index.js'

// Force Google DNS (same fix as the main app)
dns.setServers(['8.8.8.8', '8.8.4.4'])

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/deleteUser.js <email>')
  process.exit(1)
}

await mongoose.connect(process.env.DB_URL)
const result = await User.deleteOne({ email: email.toLowerCase() })
if (result.deletedCount > 0) {
  console.log(`✅ Deleted user: ${email}`)
} else {
  console.log(`⚠️  No user found with email: ${email}`)
}
await mongoose.disconnect()
