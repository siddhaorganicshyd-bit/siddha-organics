import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/index.js'

export default function AdminLoginPage() {
  const { loginAdmin, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (isAdmin) {
    navigate('/admin/dashboard', { replace: true })
    return null
  }

  const validateField = (name, value) => {
    if (name === 'email') return !value.trim() ? 'Email is required' : ''
    if (name === 'password') return !value ? 'Password is required' : ''
    return ''
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const newErrors = {}
    Object.entries(form).forEach(([name, value]) => {
      const err = validateField(name, value)
      if (err) newErrors[name] = err
    })
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setLoading(true)
    try {
      const result = await loginAdmin(form.email, form.password)
      if (result.success) navigate('/admin/dashboard', { replace: true })
      else setServerError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Top badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">Secure Admin Portal</span>
          </div>
        </div>

        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(160deg, #1E293B, #0F172A)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Header strip */}
          <div
            className="px-8 pt-8 pb-6 text-center"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}>
              <span className="text-3xl">🛡️</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Admin Access</h1>
            <p className="text-slate-400 text-sm">Siddha Organics Management Console</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            {serverError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
                <span>🚫</span> {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Admin Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="admin@siddhaorganics.com"
                  autoComplete="email"
                  className={`w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border border-red-500/50 bg-red-500/10 focus:ring-red-500/30'
                      : 'border border-white/10 bg-white/5 focus:border-emerald-500/50 focus:ring-emerald-500/20 focus:bg-white/8'
                  }`}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                      errors.password
                        ? 'border border-red-500/50 bg-red-500/10 focus:ring-red-500/30'
                        : 'border border-white/10 bg-white/5 focus:border-emerald-500/50 focus:ring-emerald-500/20 focus:bg-white/8'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm mt-1 transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating…
                  </span>
                ) : (
                  '🔐 Sign In to Dashboard'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div
            className="px-8 py-4 text-center"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-slate-500 text-xs">
              🔒 This portal is restricted to authorised personnel only
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Not an admin?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline">
            Customer login →
          </Link>
        </p>
      </div>
    </div>
  )
}
