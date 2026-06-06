/**
 * User Controller
 * Admin: list users, suspend, reactivate, delete
 * User: update own profile
 * Uses Mongoose User model (MongoDB)
 */

import bcrypt from 'bcryptjs'
import { User } from '../models/index.js'

// GET /api/users (admin)
export async function getAllUsers(req, res) {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 })
    return res.json(users.map((u) => u.toJSON()))
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users.' })
  }
}

// GET /api/users/:id (admin)
export async function getUser(req, res) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    return res.json(user.toJSON())
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user.' })
  }
}

// PATCH /api/users/:id/suspend (admin)
export async function suspendUser(req, res) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot suspend an admin.' })

    user.status = 'suspended'
    await user.save()
    return res.json(user.toJSON())
  } catch (err) {
    return res.status(500).json({ error: 'Failed to suspend user.' })
  }
}

// PATCH /api/users/:id/reactivate (admin)
export async function reactivateUser(req, res) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found.' })

    user.status = 'active'
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    await user.save()
    return res.json(user.toJSON())
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reactivate user.' })
  }
}

// DELETE /api/users/:id (admin)
export async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete an admin account.' })

    await User.findByIdAndDelete(req.params.id)
    return res.json({ message: 'User deleted.' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user.' })
  }
}

// PUT /api/users/me (user)
export async function updateProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId).select('+passwordHash')
    if (!user) return res.status(404).json({ error: 'User not found.' })

    const { fullName, phone, currentPassword, newPassword } = req.body

    if (fullName) {
      if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100) {
        return res.status(400).json({ error: 'Full name must be between 2 and 100 characters.' })
      }
      if (!/^[a-zA-Z\s'\-]+$/.test(fullName.trim())) {
        return res.status(400).json({ error: 'Full name can only contain letters, spaces, hyphens, and apostrophes.' })
      }
      user.fullName = fullName.trim()
    }
    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ error: 'Phone must be exactly 10 digits.' })
      }
      if (!/^[6-9]/.test(phone)) {
        return res.status(400).json({ error: 'Enter a valid Indian mobile number (starts with 6–9).' })
      }
      user.phone = phone
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required.' })
      }
      const isValid = await user.comparePassword(currentPassword)
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect.' })
      }
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters.' })
      }
      if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({ error: 'New password must contain at least one uppercase letter.' })
      }
      if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({ error: 'New password must contain at least one lowercase letter.' })
      }
      if (!/\d/.test(newPassword)) {
        return res.status(400).json({ error: 'New password must contain at least one digit.' })
      }
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
        return res.status(400).json({ error: 'New password must contain at least one special character.' })
      }
      const isSame = await user.comparePassword(newPassword)
      if (isSame) {
        return res.status(400).json({ error: 'New password must be different from your current password.' })
      }
      user.passwordHash = newPassword // pre-save hook will hash it
    }

    await user.save()
    return res.json(user.toJSON())
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' })
  }
}
