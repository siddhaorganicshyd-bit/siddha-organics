/**
 * API Configuration
 * Uses VITE_API_URL env variable if available, otherwise falls back to production URL.
 */
export const API_URL = import.meta.env.VITE_API_URL || 'https://siddha-organics.onrender.com'
