import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiddhaLogo from '../../components/ui/SiddhaLogo.jsx'
import OtpInput from '../../components/ui/OtpInput.jsx'
import Button from '../../components/ui/Button.jsx'
import * as otpService from '../../services/otpService.js'
import { validatePassword, getPasswordStrength } from '../../utils/validators.js'

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown() {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef(null)

  const start = useCallback((duration = 30) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSeconds(duration)
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return { seconds, start }
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = ['Email', 'Verify Code', 'New Password']

function StepIndicator({ currentStep }) {
  return (
    <nav aria-label="Password reset progress" className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = currentStep > stepNum
        const isActive = currentStep === stepNum

        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-green text-white'
                    : isActive
                    ? 'bg-green text-white ring-4 ring-green/20'
                    : 'bg-gray-200 text-gray-500'
                }`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${stepNum}: ${label}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  isActive ? 'text-green' : isCompleted ? 'text-green' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 rounded transition-all mb-4 ${
                  currentStep > stepNum ? 'bg-green' : 'bg-gray-200'
                }`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

// ─── Step 1: Email Form ───────────────────────────────────────────────────────

function Step1Email({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      const result = await otpService.forgotPassword(email.trim())
      // Always advance (anti-enumeration: same UX for unknown emails)
      onSuccess({ email: email.trim(), userId: result.userId || null, devOtp: result.devOtp || null })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5" aria-busy={loading}>
      <div>
        <label htmlFor="fp-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Email address
        </label>
        <input
          id="fp-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
          placeholder="your.email@example.com"
          autoComplete="email"
          autoFocus
          aria-describedby={error ? 'fp-email-error' : undefined}
          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green/30 transition-colors ${
            error
              ? 'border-red-400 bg-red-50 focus:border-red-400'
              : 'border-gray-200 bg-gray-50 focus:border-green focus:bg-white'
          }`}
        />
        {error && (
          <p id="fp-email-error" className="text-red-500 text-xs mt-1" role="alert">
            {error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        loading={loading}
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-sm"
        style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
      >
        Send Reset Code →
      </Button>

      <p className="text-center text-sm text-gray-500">
        Remember your password?{' '}
        <Link to="/login" className="text-green font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}

// ─── Step 2: OTP Verification ─────────────────────────────────────────────────

function Step2Otp({ email, userId, devOtp: initialDevOtp, onSuccess }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [devOtp, setDevOtp] = useState(initialDevOtp)
  const { seconds: cooldown, start: startCooldown } = useCountdown()

  // Start cooldown on mount (OTP was just sent in step 1)
  useEffect(() => {
    startCooldown(30)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = async () => {
    setError(null)
    setOtp('')
    try {
      const result = await otpService.forgotPassword(email)
      if (result.devOtp) setDevOtp(result.devOtp)
      startCooldown(30)
    } catch {
      setError('Network error. Please try again.')
    }
  }

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit reset code'); return }
    if (!userId) { setError('Session expired. Please start over.'); return }

    setLoading(true)
    setError(null)
    try {
      const result = await otpService.verifyReset(userId, otp)
      if (result.success) {
        onSuccess({ userId: result.userId || userId })
      } else {
        setError(result.error || 'Incorrect code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-gray-500 text-center">
        We sent a 6-digit code to <span className="font-semibold text-gray-700">{email}</span>
      </p>

      {/* OTP sent notification */}

      <div aria-busy={loading}>
        <OtpInput
          value={otp}
          onChange={(val) => { setOtp(val); if (error) setError(null) }}
          loading={loading}
          error={error}
          disabled={loading}
        />
      </div>

      <Button
        type="button"
        onClick={handleVerify}
        loading={loading}
        disabled={loading || otp.length < 6}
        className="w-full py-3 rounded-xl font-bold text-sm"
        style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
      >
        Verify Code →
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0 || loading}
        className="text-xs text-green hover:underline disabled:text-gray-400 disabled:no-underline text-center"
        aria-live="polite"
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
      </button>
    </div>
  )
}

// ─── Step 3: New Password Form ────────────────────────────────────────────────

function Step3Password({ userId, onSuccess }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const strength = getPasswordStrength(newPassword)

  const validateForm = () => {
    const { valid, errors } = validatePassword(newPassword)
    if (!valid) return errors[0]
    if (newPassword !== confirmPassword) return 'Passwords do not match'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validateForm()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      const result = await otpService.resetPassword(userId, newPassword)
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Reset failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5" aria-busy={loading}>
      {/* New password */}
      <div>
        <label htmlFor="fp-new-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
          New password
        </label>
        <div className="relative">
          <input
            id="fp-new-password"
            type={showPw ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError('') }}
            placeholder="Create a strong password"
            autoComplete="new-password"
            autoFocus
            aria-describedby="fp-pw-strength fp-pw-error"
            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green focus:bg-white transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            tabIndex={-1}
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>

        {/* Password strength meter */}
        {newPassword && (
          <div id="fp-pw-strength" className="mt-2" aria-live="polite">
            <div className="flex gap-1 mb-1" aria-hidden="true">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all"
                  style={{ background: i <= strength.score ? strength.color : '#E5E7EB' }}
                />
              ))}
            </div>
            {strength.label && (
              <p className="text-xs font-medium" style={{ color: strength.color }}>
                {strength.label}
              </p>
            )}
          </div>
        )}

        {/* Password requirements hint */}
        <p className="text-xs text-gray-400 mt-1.5">
          Min 8 chars · uppercase · lowercase · number · special character
        </p>
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="fp-confirm-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Confirm new password
        </label>
        <div className="relative">
          <input
            id="fp-confirm-password"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
            placeholder="Re-enter new password"
            autoComplete="new-password"
            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green focus:bg-white transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            tabIndex={-1}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? '🙈' : '👁️'}
          </button>
        </div>
        {passwordsMatch && (
          <p className="text-green text-xs mt-1" aria-live="polite">✓ Passwords match</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p id="fp-pw-error" className="text-red-500 text-xs" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={loading}
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-sm"
        style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
      >
        {loading ? 'Resetting…' : 'Reset Password →'}
      </Button>
    </form>
  )
}

// ─── Step 4: Success ──────────────────────────────────────────────────────────

function StepSuccess({ onGoToLogin }) {
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center" role="status" aria-live="polite">
      <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center text-3xl">
        ✅
      </div>
      <div>
        <h2 className="font-serif text-xl font-bold text-green mb-1">Password Reset!</h2>
        <p className="text-gray-500 text-sm">
          Your password has been updated. You can now sign in with your new password.
        </p>
      </div>
      <Button
        type="button"
        onClick={onGoToLogin}
        className="w-full py-3 rounded-xl font-bold text-sm"
        style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
      >
        Go to Sign In →
      </Button>
    </div>
  )
}

// ─── Main ForgotPasswordPage ──────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  // Wizard state
  const [step, setStep] = useState(1) // 1 | 2 | 3 | 4 (success)
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState(null)
  const [devOtp, setDevOtp] = useState(null)

  // Step 1 → 2
  const handleEmailSuccess = ({ email: submittedEmail, userId: uid, devOtp: otp }) => {
    setEmail(submittedEmail)
    setUserId(uid)
    setDevOtp(otp)
    setStep(2)
  }

  // Step 2 → 3
  const handleOtpSuccess = ({ userId: verifiedUserId }) => {
    setUserId(verifiedUserId)
    setStep(3)
  }

  // Step 3 → 4 (success)
  const handlePasswordSuccess = () => {
    setStep(4)
  }

  // Success → /login
  const handleGoToLogin = () => {
    navigate('/login', { replace: true })
  }

  // Step labels for the header subtitle
  const stepSubtitles = {
    1: 'Enter your email to receive a reset code',
    2: `Code sent to ${email || 'your email'}`,
    3: 'Create your new password',
    4: 'Your password has been updated',
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE5D0 100%)' }}>
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #2D5016 0%, #4A7C2F 60%, #6B9E45 100%)' }}
      >
        <div
          className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F5F0E8, transparent)', transform: 'translate(-30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F5C842, transparent)', transform: 'translate(30%, 30%)' }}
        />
        <div className="relative z-10 text-center max-w-sm">
          <SiddhaLogo variant="light" size="lg" className="mx-auto mb-8" />
          <h2 className="font-serif text-4xl font-bold text-white mb-4 leading-tight">
            Reset Your <span style={{ color: '#F5C842' }}>Password</span>
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-10">
            Follow the steps to securely reset your password and regain access to your account.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: step > 1 ? '✅' : '📧', text: 'Enter your registered email' },
              { icon: step > 2 ? '✅' : '🔢', text: 'Verify with a 6-digit code' },
              { icon: step > 3 ? '✅' : '🔑', text: 'Set your new password' },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-left"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-white/90 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right content panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/">
              <SiddhaLogo variant="dark" size="md" className="mx-auto" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-cream-dark p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                {step < 4 && (
                  <Link
                    to="/login"
                    className="text-gray-400 hover:text-gray-600 transition-colors text-lg"
                    aria-label="Back to login"
                  >
                    ←
                  </Link>
                )}
                <div>
                  <h1 className="font-serif text-2xl font-bold text-green">
                    {step === 4 ? 'Password Reset!' : 'Forgot Password'}
                  </h1>
                  <p className="text-gray-500 text-xs mt-0.5">{stepSubtitles[step]}</p>
                </div>
              </div>

              {/* Step counter for screen readers */}
              {step < 4 && (
                <p className="sr-only" aria-live="polite">
                  Step {step} of 3: {STEPS[step - 1]}
                </p>
              )}
            </div>

            {/* Step indicator (steps 1–3 only) */}
            {step < 4 && <StepIndicator currentStep={step} />}

            {/* Step content */}
            {step === 1 && (
              <Step1Email onSuccess={handleEmailSuccess} />
            )}

            {step === 2 && (
              <Step2Otp
                email={email}
                userId={userId}
                devOtp={devOtp}
                onSuccess={handleOtpSuccess}
              />
            )}

            {step === 3 && (
              <Step3Password
                userId={userId}
                onSuccess={handlePasswordSuccess}
              />
            )}

            {step === 4 && (
              <StepSuccess onGoToLogin={handleGoToLogin} />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
