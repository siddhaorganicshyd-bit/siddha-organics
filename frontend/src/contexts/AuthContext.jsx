import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const TOKEN_KEY = 'siddha_token'
const USER_KEY = 'siddha_user'

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function loadSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const raw = localStorage.getItem(USER_KEY)
    if (!token || !raw) return null
    return { token, user: JSON.parse(raw) }
  } catch {
    return null
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState = {
  currentUser: null,
  isAuthenticated: false,
  isAdmin: false,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: !!action.payload,
        isAdmin: action.payload?.role === 'admin',
      }
    case 'LOGOUT':
      return { currentUser: null, isAuthenticated: false, isAdmin: false }
    default:
      return state
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const ADMIN_IDLE_TIMEOUT_MS = 60 * 60 * 1000

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Restore session on mount
  useEffect(() => {
    const session = loadSession()
    if (session?.user) {
      dispatch({ type: 'SET_USER', payload: session.user })
    }
  }, [])

  // Admin idle timeout
  useEffect(() => {
    if (!state.isAdmin) return
    let timer = null
    const resetTimer = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => handleLogout(), ADMIN_IDLE_TIMEOUT_MS)
    }
    const events = ['mousemove', 'keydown', 'click']
    events.forEach((evt) => window.addEventListener(evt, resetTimer))
    resetTimer()
    return () => {
      if (timer) clearTimeout(timer)
      events.forEach((evt) => window.removeEventListener(evt, resetTimer))
    }
  }, [state.isAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auth actions ─────────────────────────────────────────────────────────

  const handleRegister = useCallback(async (payload) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) return { success: true, user: data.user }
      // Pass through needsVerification fields so RegisterPage can handle them
      return {
        success: false,
        error: data.error || 'Registration failed.',
        needsVerification: data.needsVerification || false,
        userId: data.userId,
        email: data.email,
      }
    } catch {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [])

  const handleLogin = useCallback(async (email, password, rememberMe) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Login failed.', needsVerification: data.needsVerification, userId: data.userId }
      saveSession(data.token, data.user)
      dispatch({ type: 'SET_USER', payload: data.user })
      return { success: true, user: data.user }
    } catch {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [])

  const handleLoginAdmin = useCallback(async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || 'Login failed.' }
      saveSession(data.token, data.user)
      dispatch({ type: 'SET_USER', payload: data.user })
      return { success: true, user: data.user }
    } catch {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }, [])

  const handleLogout = useCallback(() => {
    clearSession()
    dispatch({ type: 'LOGOUT' })
  }, [])

  // Called after OTP verification to activate session without re-login
  const handleActivateSession = useCallback((user, token) => {
    saveSession(token, user)
    dispatch({ type: 'SET_USER', payload: user })
  }, [])

  const value = {
    currentUser: state.currentUser,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.isAdmin,
    login: handleLogin,
    loginAdmin: handleLoginAdmin,
    logout: handleLogout,
    register: handleRegister,
    activateSession: handleActivateSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export default AuthContext
