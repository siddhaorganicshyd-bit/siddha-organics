import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/index.js'
import SiddhaLogo from '../../components/ui/SiddhaLogo.jsx'
import OtpInput from '../../components/ui/OtpInput.jsx'
import * as otpService from '../../services/otpService.js'
import * as firebasePhoneAuth from '../../services/firebasePhoneAuth.js'

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(initial = 0) {
  const [seconds, setSeconds] = useState(initial)
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

// ─── Email Verification Panel ─────────────────────────────────────────────────

function EmailPanel({ userId, email, onVerified, isActive }) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [verified, setVerified] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [status, setStatus] = useState('')
  const { seconds: cooldown, start: startCooldown } = useCountdown()

  // Send email OTP on mount
  useEffect(() => {
    let cancelled = false
    async function sendInitial() {
      const result = await otpService.sendEmailOTP(userId, 'verification')
      if (cancelled) return
      if (result.dev) {
        setDevMode(true)
        setStatus('Check server console for OTP')
      }
      startCooldown(30)
    }
    sendInitial()
    return () => { cancelled = true }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = async () => {
    setError(null)
    setStatus('')
    const result = await otpService.sendEmailOTP(userId, 'verification')
    if (result.dev) {
      setDevMode(true)
      setStatus('Check server console for OTP')
    }
    startCooldown(30)
  }

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true)
    setError(null)
    try {
      const result = await otpService.verifyEmailOTP(userId, otp, 'verification')
      if (result.success) {
        setVerified(true)
        setStatus('Email verified!')
        onVerified(result)
      } else {
        setError(result.error || 'Verification failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`flex-1 rounded-2xl border-2 p-6 transition-all ${
        verified
          ? 'border-green bg-green/5'
          : isActive
          ? 'border-green/40 bg-white shadow-md'
          : 'border-gray-200 bg-white'
      }`}
      aria-current={isActive ? 'step' : undefined}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${verified ? 'bg-green/10' : 'bg-gray-100'}`}>
            📧
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Email Verification</p>
            <p className="text-xs text-gray-500 truncate max-w-[160px]">{email}</p>
          </div>
        </div>
        {verified && (
          <span className="flex items-center gap-1 text-green text-sm font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span>
        )}
      </div>

      {/* Dev mode banner — hidden in production */}

      {/* Status message */}
      {status && (
        <p className="text-xs text-gray-500 mb-3" aria-live="polite">{status}</p>
      )}

      {/* OTP input + verify */}
      {!verified && (
        <div className="flex flex-col gap-4">
          <OtpInput
            value={otp}
            onChange={(val) => { setOtp(val); if (error) setError(null) }}
            loading={loading}
            error={error}
            success={verified}
            disabled={verified}
          />

          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || otp.length < 6}
            className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
          >
            {loading ? 'Verifying…' : 'Verify Email'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className="text-xs text-green hover:underline disabled:text-gray-400 disabled:no-underline text-center"
            aria-live="polite"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
          </button>
        </div>
      )}

      {/* Verified state */}
      {verified && (
        <div className="flex flex-col items-center gap-2 py-2" aria-live="polite">
          <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-green">Email verified successfully!</p>
        </div>
      )}
    </div>
  )
}

// ─── Phone Verification Panel ─────────────────────────────────────────────────

function PhonePanel({ userId, phone, onVerified, isActive }) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [verified, setVerified] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [devOtp, setDevOtp] = useState(null)
  const [status, setStatus] = useState('')
  const { seconds: cooldown, start: startCooldown } = useCountdown()

  // Init recaptcha and send phone OTP on mount
  useEffect(() => {
    let cancelled = false
    async function sendInitial() {
      firebasePhoneAuth.initRecaptcha('recaptcha-container')
      const result = await firebasePhoneAuth.sendPhoneOTP(phone)
      if (cancelled) return
      if (result.dev) {
        setDevMode(true)
        setDevOtp(result.devOtp || null)
      } else if (!result.success) {
        setError(result.error || 'Failed to send OTP. Please try again.')
      }
      startCooldown(30)
    }
    sendInitial()
    return () => {
      cancelled = true
      firebasePhoneAuth.clearPhoneSession()
    }
  }, [phone]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = async () => {
    setError(null)
    setStatus('')
    firebasePhoneAuth.initRecaptcha('recaptcha-container')
    const result = await firebasePhoneAuth.sendPhoneOTP(phone)
    if (result.dev) {
      setDevMode(true)
      setDevOtp(result.devOtp || null)
    } else if (!result.success) {
      setError(result.error || 'Failed to resend OTP. Please try again.')
      return
    }
    startCooldown(30)
  }

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true)
    setError(null)
    try {
      // Step 1: Verify with Firebase client-side
      const firebaseResult = await firebasePhoneAuth.verifyPhoneOTP(otp)
      if (!firebaseResult.success) {
        setError(firebaseResult.error || 'Verification failed. Please try again.')
        return
      }

      // Step 2: Notify backend that phone is verified
      const backendResult = await otpService.verifyPhoneOTP(userId)
      if (backendResult.success) {
        setVerified(true)
        setStatus('Phone verified!')
        onVerified(backendResult)
      } else {
        setError(backendResult.error || 'Backend verification failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`flex-1 rounded-2xl border-2 p-6 transition-all ${
        verified
          ? 'border-green bg-green/5'
          : isActive
          ? 'border-green/40 bg-white shadow-md'
          : 'border-gray-200 bg-white'
      }`}
      aria-current={isActive ? 'step' : undefined}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${verified ? 'bg-green/10' : 'bg-gray-100'}`}>
            📱
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Phone Verification</p>
            <p className="text-xs text-gray-500">+91 {phone}</p>
          </div>
        </div>
        {verified && (
          <span className="flex items-center gap-1 text-green text-sm font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span>
        )}
      </div>

      {/* Dev mode banner — hidden in production */}

      {/* Status message */}
      {status && (
        <p className="text-xs text-gray-500 mb-3" aria-live="polite">{status}</p>
      )}

      {/* OTP input + verify */}
      {!verified && (
        <div className="flex flex-col gap-4">
          <OtpInput
            value={otp}
            onChange={(val) => { setOtp(val); if (error) setError(null) }}
            loading={loading}
            error={error}
            success={verified}
            disabled={verified}
          />

          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || otp.length < 6}
            className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
          >
            {loading ? 'Verifying…' : 'Verify Phone'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className="text-xs text-green hover:underline disabled:text-gray-400 disabled:no-underline text-center"
            aria-live="polite"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
          </button>
        </div>
      )}

      {/* Verified state */}
      {verified && (
        <div className="flex flex-col items-center gap-2 py-2" aria-live="polite">
          <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-green">Phone verified successfully!</p>
        </div>
      )}
    </div>
  )
}

// ─── Main VerifyAccountPage ───────────────────────────────────────────────────

export default function VerifyAccountPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activateSession } = useAuth()

  const { userId, email, phone } = location.state || {}

  // Guard: redirect if required state is missing
  useEffect(() => {
    if (!userId || !email || !phone) {
      navigate('/register', { replace: true })
    }
  }, [userId, email, phone, navigate])

  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [sessionData, setSessionData] = useState(null) // { user, token } when available
  const [completing, setCompleting] = useState(false)

  // Called when either panel's verify response comes back
  const handleEmailVerified = useCallback((result) => {
    setEmailVerified(true)
    if (result.bothVerified && result.user && result.token) {
      setSessionData({ user: result.user, token: result.token })
      activateSession(result.user, result.token)
      navigate('/', { replace: true })
    }
  }, [activateSession, navigate])

  const handlePhoneVerified = useCallback((result) => {
    setPhoneVerified(true)
    if (result.bothVerified && result.user && result.token) {
      setSessionData({ user: result.user, token: result.token })
      activateSession(result.user, result.token)
      navigate('/', { replace: true })
    }
  }, [activateSession, navigate])

  const handleCompleteRegistration = () => {
    if (!emailVerified) return
    if (sessionData?.user && sessionData?.token) {
      setCompleting(true)
      activateSession(sessionData.user, sessionData.token)
      navigate('/', { replace: true })
    }
  }

  // Don't render if state is missing (redirect will fire)
  if (!userId || !email || !phone) return null

  const bothVerified = emailVerified && phoneVerified

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE5D0 100%)' }}>
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center p-12 relative overflow-hidden"
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
        <div className="relative z-10 text-center max-w-xs">
          <SiddhaLogo variant="light" size="lg" className="mx-auto mb-6" />
          <h2 className="font-serif text-3xl font-bold text-white mb-3 leading-tight">
            Almost <span style={{ color: '#F5C842' }}>There!</span>
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8">
            Verify your email to activate your account and start shopping.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: emailVerified ? '✅' : '1️⃣', text: 'Verify your email address' },
              { icon: emailVerified ? '✅' : '🎉', text: 'Account activated!' },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-left"
              >
                <span className="text-lg">{icon}</span>
                <span className="text-white/90 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right content panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <SiddhaLogo variant="dark" size="md" className="mx-auto" />
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-cream-dark p-6 sm:p-8">
            {/* Page header */}
            <div className="text-center mb-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
              >
                <span className="text-3xl">🔐</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-green mb-2">
                Verify Your Account
              </h1>
              <p className="text-gray-500 text-sm">
                Enter the OTPs sent to your email and phone to activate your account
              </p>
            </div>

            {/* Email verification panel */}
            <div className="mb-6">
              <EmailPanel
                userId={userId}
                email={email}
                onVerified={handleEmailVerified}
                isActive={!emailVerified}
              />
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-3 mb-6" aria-live="polite">
              <div className={`flex items-center gap-1.5 text-xs font-medium ${emailVerified ? 'text-green' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${emailVerified ? 'bg-green' : 'bg-gray-300'}`} />
                Email {emailVerified ? 'verified' : 'pending'}
              </div>
            </div>

            {/* Complete Registration button */}
            <button
              type="button"
              onClick={handleCompleteRegistration}
              disabled={!emailVerified || completing}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
              aria-disabled={!bothVerified}
            >
              {completing
                ? 'Activating account…'
                : bothVerified
                ? '✓ Complete Registration →'
                : 'Verify both to continue'}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">
              Having trouble?{' '}
              <a href="mailto:support@siddhaorganics.com" className="text-green hover:underline">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Hidden reCAPTCHA container for Firebase invisible reCAPTCHA */}
      <div id="recaptcha-container" className="hidden" aria-hidden="true" />
    </div>
  )
}
