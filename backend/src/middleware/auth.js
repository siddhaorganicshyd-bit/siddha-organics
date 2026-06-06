/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */

import jwt from 'jsonwebtoken'

/**
 * Protect routes — requires valid JWT
 */
export function protect(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret')
    req.user = decoded // { userId, role, email }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

/**
 * Restrict to admin role only
 */
export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' })
  }
  next()
}
