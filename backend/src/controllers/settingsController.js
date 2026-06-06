/**
 * Settings Controller
 * Uses the Mongoose Settings model (singleton document) instead of in-memory store.
 */

import Settings from '../models/Settings.js'

// GET /api/settings
export async function getSettings(req, res) {
  try {
    let settings = await Settings.findOne({})
    if (!settings) {
      // Return schema defaults without persisting
      settings = new Settings()
    }
    return res.json(settings)
  } catch (err) {
    console.error('getSettings error:', err)
    return res.status(500).json({ message: 'Failed to retrieve settings' })
  }
}

// PUT /api/settings (admin)
export async function updateSettings(req, res) {
  try {
    const updated = await Settings.findOneAndUpdate(
      {},
      req.body,
      { upsert: true, new: true, runValidators: true }
    )
    return res.json(updated)
  } catch (err) {
    console.error('updateSettings error:', err)
    if (err.name === 'ValidationError') {
      return res.status(422).json({ message: err.message, errors: err.errors })
    }
    return res.status(500).json({ message: 'Failed to update settings' })
  }
}
