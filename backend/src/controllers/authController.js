/**
 * Auth Controller
 * Handles registration, login, admin login, logout, get current user
 * Uses Mongoose User model (MongoDB)
 */

import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'
const LOCKOUT_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

function generateToken(user, rememberMe = false) {
  const expiresIn = rememberMe ? '30d' : '1d'
  return jwt.sign(
    { userId: user._id.toString(), role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn }
  )
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { fullName, email, phone, password } = req.body

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required.' })
    }

    // fullName: 2–100 chars, letters/spaces/hyphens/apostrophes only
    if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100) {
      return res.status(400).json({ error: 'Full name must be between 2 and 100 characters.' })
    }
    if (!/^[a-zA-Z\s'\-]+$/.test(fullName.trim())) {
      return res.status(400).json({ error: 'Full name can only contain letters, spaces, hyphens, and apostrophes.' })
    }

    // email: valid format, max 254 chars
    if (typeof email !== 'string' || email.length > 254) {
      return res.status(400).json({ error: 'Invalid email address.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }

    // phone: exactly 10 digits, starts with 6–9
    if (typeof phone !== 'string' || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Phone must be exactly 10 digits.' })
    }
    if (!/^[6-9]/.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid Indian mobile number (starts with 6–9).' })
    }

    // password: min 8, must have uppercase, lowercase, digit, special char
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' })
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter.' })
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one digit.' })
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one special character.' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      // If account exists but is pending verification, allow re-sending OTP
      if (existing.status === 'pending_verification') {
        return res.status(409).json({
          error: 'Email is already registered but not verified.',
          needsVerification: true,
          userId: existing._id.toString(),
          email: existing.email,
        })
      }
      return res.status(409).json({ error: 'Email is already registered.' })
    }

    const existingPhone = await User.findOne({ phone })
    if (existingPhone) {
      return res.status(409).json({ error: 'Phone number is already registered.' })
    }

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      phone,
      passwordHash: password, // pre-save hook will hash it
      role: 'user',
      status: 'pending_verification',
      emailVerified: false,
      phoneVerified: true, // Auto-verify phone (no SMS provider configured)
    })

    await newUser.save()

    return res.status(201).json({
      success: true,
      user: newUser.toJSON(),
    })
  } catch (err) {
    console.error('Register error:', err.message)
    return res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password, rememberMe } = req.body

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash')
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Check lockout
    if (user.isLocked()) {
      const remaining = Math.ceil((user.lockedUntil - new Date()) / 60000)
      return res.status(423).json({ error: `Account locked. Try again in ${remaining} minute(s).` })
    }

    // Check status
    if (user.status === 'pending_verification') {
      return res.status(403).json({
        error: 'Account not verified. Please complete email and phone verification.',
        needsVerification: true,
        userId: user._id.toString(),
      })
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact support.' })
    }

    const isValid = await user.comparePassword(password)
    if (!isValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
      if (user.failedLoginAttempts >= LOCKOUT_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
        user.failedLoginAttempts = 0
      }
      await user.save()
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Reset on success
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    await user.save()

    const token = generateToken(user, rememberMe)
    return res.json({ token, user: user.toJSON() })
  } catch (err) {
    console.error('Login error:', err.message)
    return res.status(500).json({ error: 'Login failed. Please try again.' })
  }
}

// POST /api/auth/login/admin
export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash')
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended.' })
    }

    const isValid = await user.comparePassword(password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    const token = generateToken(user)
    return res.json({ token, user: user.toJSON() })
  } catch (err) {
    console.error('Admin login error:', err.message)
    return res.status(500).json({ error: 'Login failed. Please try again.' })
  }
}

// POST /api/auth/logout
export async function logout(req, res) {
  return res.json({ message: 'Logged out successfully.' })
}

// GET /api/auth/me
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    return res.json(user.toJSON())
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user.' })
  }
}

// POST /api/auth/verify-otp  — mark email/phone verified, activate account
export async function verifyOTP(req, res) {
  try {
    const { userId, type } = req.body // type: 'email' | 'phone'

    if (!userId || !type) {
      return res.status(400).json({ error: 'userId and type are required.' })
    }
    if (!['email', 'phone'].includes(type)) {
      return res.status(400).json({ error: "type must be 'email' or 'phone'." })
    }

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found.' })

    if (type === 'email') user.emailVerified = true
    if (type === 'phone') user.phoneVerified = true

    // Activate account only when BOTH email and phone are verified
    if (user.emailVerified && user.phoneVerified) {
      user.status = 'active'
      await user.save()
      const token = generateToken(user)
      return res.json({ success: true, user: user.toJSON(), token })
    }

    await user.save()
    return res.json({ success: true, user: user.toJSON() })
  } catch (err) {
    console.error('Verify OTP error:', err.message)
    return res.status(500).json({ error: 'Verification failed.' })
  }
}
