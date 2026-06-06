/**
 * Firebase Configuration
 * Used for Phone Number Authentication (OTP via SMS).
 *
 * Setup steps:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a project → Add Web App → copy config below
 * 3. Enable Authentication → Sign-in method → Phone
 * 4. Add your domain to Authorized domains
 * 5. Replace the placeholder values below with your actual config
 */

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || '',
}

// Only initialize if config is provided
const isConfigured = firebaseConfig.apiKey && firebaseConfig.projectId

let app = null
let auth = null

if (isConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
} else {
  console.warn('⚠️ Firebase not configured — phone OTP will use dev fallback mode.')
}

export { auth, isConfigured }
export default app
