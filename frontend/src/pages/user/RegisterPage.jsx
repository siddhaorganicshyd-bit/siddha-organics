import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/index.js'
import { getPasswordStrength } from '../../utils/validators.js'
import SiddhaLogo from '../../components/ui/SiddhaLogo.jsx'

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const strength = getPasswordStrength(form.password)

  if (isAuthenticated) { navigate('/', { replace: true }); return null }

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return 'Name can only contain letters, spaces, hyphens and apostrophes'
        return ''
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
        // Block obviously fake local parts
        const local = value.split('@')[0].toLowerCase()
        const fakeParts = ['test', 'fake', 'dummy', 'asdf', 'qwerty', 'abc', 'xyz', 'aaa', 'bbb', '123', '1234']
        if (fakeParts.includes(local)) return 'Please use your real email address'
        return ''
      case 'phone':
        if (!value.trim()) return 'Phone number is required'
        if (!/^\d{10}$/.test(value.trim())) return 'Phone must be exactly 10 digits'
        if (!/^[6-9]/.test(value.trim())) return 'Enter a valid Indian mobile number (starts with 6–9)'
        if (/^(\d)\1{9}$/.test(value.trim())) return 'Enter a real mobile number'
        const fakeNums = ['9876543210', '1234567890', '9999999999', '8888888888', '7777777777']
        if (fakeNums.includes(value.trim())) return 'Enter a real mobile number'
        return ''
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
        if (!/[A-Z]/.test(value)) return 'Must contain at least one uppercase letter'
        if (!/[a-z]/.test(value)) return 'Must contain at least one lowercase letter'
        if (!/\d/.test(value)) return 'Must contain at least one number'
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return 'Must contain at least one special character'
        return ''
      case 'confirmPassword':
        if (!value) return 'Please confirm your password'
        if (value !== form.password) return 'Passwords do not match'
        return ''
      default:
        return ''
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    if (name === 'password' && form.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: value !== form.confirmPassword ? 'Passwords do not match' : '',
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const newErrors = {}
    Object.keys(form).forEach((name) => {
      const err = validateField(name, form[name])
      if (err) newErrors[name] = err
    })
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setLoading(true)
    try {
      const result = await register({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password })
      if (result.success) {
        // Navigate to VerifyAccountPage with userId, email, and phone
        const userId = result.user._id || result.user.id
        navigate('/verify-account', {
          state: { userId, email: result.user.email, phone: result.user.phone || form.phone },
        })
      } else if (result.needsVerification) {
        navigate('/verify-account', {
          state: { userId: result.userId, email: result.email, phone: form.phone },
        })
      } else {
        setServerError(result.error || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green/30 ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-green focus:bg-white'
    }`

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE5D0 100%)' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #2D5016 0%, #4A7C2F 60%, #6B9E45 100%)' }}
      >
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F5F0E8, transparent)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F5C842, transparent)', transform: 'translate(30%, 30%)' }} />
        <div className="relative z-10 text-center max-w-xs">
          <SiddhaLogo variant="light" size="lg" className="mx-auto mb-6" />
          <h2 className="font-serif text-3xl font-bold text-white mb-3 leading-tight">
            Join the<br /><span style={{ color: '#F5C842' }}>Organic Family</span>
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8">
            Create your account with your real email and phone number to get started.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: '🔒', text: 'Real credentials required' },
              { icon: '📧', text: 'Email + phone verification' },
              { icon: '💚', text: 'Secure & trusted checkout' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-left">
                <span className="text-lg">{icon}</span>
                <span className="text-white/90 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/">
              <SiddhaLogo variant="dark" size="md" className="mx-auto" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-cream-dark p-8">
            <div className="mb-6">
              <h1 className="font-serif text-3xl font-bold text-green mb-1">Create account</h1>
              <p className="text-gray-500 text-sm">Use your real email and phone — we'll verify them</p>
            </div>

            {serverError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                <span className="mt-0.5">⚠️</span>
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
                <input id="fullName" name="fullName" type="text" value={form.fullName} onChange={handleChange} onBlur={handleBlur} placeholder="Your full name" autoComplete="name" className={inputClass('fullName')} />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} placeholder="your.name@gmail.com" autoComplete="email" className={inputClass('email')} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                {!errors.email && form.email && <p className="text-xs text-gray-400 mt-1">📧 A verification code will be sent to this email</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile number</label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium">🇮🇳 +91</span>
                  <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} onBlur={handleBlur} placeholder="10-digit mobile number" autoComplete="tel" maxLength={10} className={`flex-1 ${inputClass('phone')}`} />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                {!errors.phone && form.phone && <p className="text-xs text-gray-400 mt-1">📱 An OTP will be sent to this number</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} onBlur={handleBlur} placeholder="Create a strong password" autoComplete="new-password" className={`${inputClass('password')} pr-12`} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm" tabIndex={-1}>{showPassword ? '🙈' : '👁️'}</button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5,6].map((i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i <= strength.score ? strength.color : '#E5E7EB' }} />
                      ))}
                    </div>
                    {strength.label && <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>}
                  </div>
                )}
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <input id="confirmPassword" name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur} placeholder="Re-enter your password" autoComplete="new-password" className={`${inputClass('confirmPassword')} pr-12`} />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm" tabIndex={-1}>{showConfirm ? '🙈' : '👁️'}</button>
                </div>
                {form.confirmPassword && !errors.confirmPassword && <p className="text-green text-xs mt-1">✓ Passwords match</p>}
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white text-sm mt-1 transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}>
                {loading ? 'Creating account…' : 'Continue →'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-green font-semibold hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
