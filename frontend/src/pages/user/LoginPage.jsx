import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/index.js'
import SiddhaLogo from '../../components/ui/SiddhaLogo.jsx'

// ─── Main LoginPage ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'

  const [form, setForm] = useState({ email: '', password: '', rememberMe: false })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (isAuthenticated) {
    navigate(returnUrl, { replace: true })
    return null
  }

  const handleForgotPassword = () => {
    navigate('/forgot-password')
  }

  const validateField = (name, value) => {
    if (name === 'email') {
      if (!value.trim()) return 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
    }
    if (name === 'password') {
      if (!value) return 'Password is required'
    }
    return ''
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const newErrors = {}
    Object.entries({ email: form.email, password: form.password }).forEach(([name, value]) => {
      const err = validateField(name, value)
      if (err) newErrors[name] = err
    })
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setLoading(true)
    try {
      const result = await login(form.email, form.password, form.rememberMe)
      if (result.success) {
        navigate(returnUrl, { replace: true })
      } else if (result.needsVerification) {
        // Account not verified — redirect to verify-account page
        navigate('/verify-account', {
          replace: true,
          state: { userId: result.userId, email: form.email, phone: '' }
        })
      } else {
        setServerError(result.error || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE5D0 100%)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #2D5016 0%, #4A7C2F 60%, #6B9E45 100%)' }}
      >
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F5F0E8, transparent)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F5C842, transparent)', transform: 'translate(30%, 30%)' }} />
        <div className="relative z-10 text-center max-w-sm">
          <SiddhaLogo variant="light" size="lg" className="mx-auto mb-8" />
          <h2 className="font-serif text-4xl font-bold text-white mb-4 leading-tight">
            Pure Goodness,<br /><span style={{ color: '#F5C842' }}>Straight from Nature</span>
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-10">
            Sign in to explore our curated range of raw honey, A2 ghee, and organic sweeteners.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: '🌿', text: '100% Organic & Natural' },
              { icon: '🚚', text: 'Free Shipping on ₹500+' },
              { icon: '🔒', text: 'Secure & Trusted Checkout' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-left">
                <span className="text-xl">{icon}</span>
                <span className="text-white/90 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/">
              <SiddhaLogo variant="dark" size="md" className="mx-auto" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-cream-dark p-8">
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-bold text-green mb-2">Welcome back 👋</h1>
              <p className="text-gray-500 text-sm">Sign in to your Siddha Organics account</p>
            </div>

            {serverError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
                <span>⚠️</span> {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <input
                  id="email" name="email" type="email"
                  value={form.email} onChange={handleChange} onBlur={handleBlur}
                  placeholder="you@example.com" autoComplete="email"
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green/30 ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-green focus:bg-white'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-green hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={handleChange} onBlur={handleBlur}
                    placeholder="Your password" autoComplete="current-password"
                    className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green/30 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-green focus:bg-white'}`}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm" tabIndex={-1}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={handleChange} className="accent-green w-4 h-4 rounded" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>

              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-green font-semibold hover:underline">Create one free</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
