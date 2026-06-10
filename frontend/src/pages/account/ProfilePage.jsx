import React, { useState } from 'react'
import { useAuth } from '../../contexts/index.js'
import Button from '../../components/ui/Button.jsx'
import FormField from '../../components/ui/FormField.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'https://siddha-organics.onrender.com'

export default function ProfilePage() {
  const { currentUser } = useAuth()

  const [profileForm, setProfileForm] = useState({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [pwErrors, setPwErrors] = useState({})
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const validateProfileField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        if (value.trim().length > 100) return 'Name must be 100 characters or fewer'
        if (!/^[a-zA-Z\s'\-]+$/.test(value.trim())) return 'Name can only contain letters, spaces, hyphens, and apostrophes'
        return ''
      case 'phone':
        if (!value.trim()) return 'Phone is required'
        if (!/^\d{10}$/.test(value.trim())) return 'Phone must be exactly 10 digits'
        if (!/^[6-9]/.test(value.trim())) return 'Enter a valid Indian mobile number (starts with 6–9)'
        return ''
      default:
        return ''
    }
  }

  const handleProfileBlur = (e) => {
    const { name, value } = e.target
    setProfileErrors((prev) => ({ ...prev, [name]: validateProfileField(name, value) }))
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
    if (profileErrors[name]) setProfileErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    const newErrors = {}
    Object.entries(profileForm).forEach(([name, value]) => {
      const err = validateProfileField(name, value)
      if (err) newErrors[name] = err
    })
    if (Object.keys(newErrors).length > 0) {
      setProfileErrors(newErrors)
      return
    }

    setProfileLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('siddha_token')}`,
        },
        body: JSON.stringify({
          fullName: profileForm.fullName.trim(),
          phone: profileForm.phone.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfileSuccess('Profile updated successfully.')
        setTimeout(() => setProfileSuccess(''), 3000)
      } else {
        setProfileErrors({ fullName: data.error || 'Failed to update profile.' })
      }
    } catch {
      setProfileErrors({ fullName: 'Network error. Please try again.' })
    } finally {
      setProfileLoading(false)
    }
  }

  const validatePwField = (name, value) => {
    switch (name) {
      case 'currentPassword':
        return !value ? 'Current password is required' : ''
      case 'newPassword':
        if (!value) return 'New password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
        if (!/[A-Z]/.test(value)) return 'Must contain at least one uppercase letter'
        if (!/[a-z]/.test(value)) return 'Must contain at least one lowercase letter'
        if (!/\d/.test(value)) return 'Must contain at least one digit'
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return 'Must contain at least one special character'
        return ''
      case 'confirmPassword':
        if (!value) return 'Please confirm your new password'
        if (value !== pwForm.newPassword) return 'Passwords do not match'
        return ''
      default:
        return ''
    }
  }

  const handlePwBlur = (e) => {
    const { name, value } = e.target
    setPwErrors((prev) => ({ ...prev, [name]: validatePwField(name, value) }))
  }

  const handlePwChange = (e) => {
    const { name, value } = e.target
    setPwForm((prev) => ({ ...prev, [name]: value }))
    if (pwErrors[name]) setPwErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handlePwSave = async (e) => {
    e.preventDefault()
    const newErrors = {}
    Object.entries(pwForm).forEach(([name, value]) => {
      const err = validatePwField(name, value)
      if (err) newErrors[name] = err
    })
    if (Object.keys(newErrors).length > 0) {
      setPwErrors(newErrors)
      return
    }

    setPwLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('siddha_token')}`,
        },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setPwSuccess('Password changed successfully.')
        setTimeout(() => setPwSuccess(''), 3000)
      } else {
        setPwErrors({ currentPassword: data.error || 'Failed to change password.' })
      }
    } catch {
      setPwErrors({ currentPassword: 'Network error. Please try again.' })
    } finally {
      setPwLoading(false)
    }
  }

  // Derive initials for avatar
  const initials = profileForm.fullName
    ? profileForm.fullName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div className="max-w-2xl">

      {/* Avatar hero card */}
      <div className="bg-green rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center shrink-0">
          <span className="font-serif text-2xl font-bold text-green">{initials}</span>
        </div>
        <div>
          <p className="font-serif text-xl font-bold text-cream leading-tight">
            {profileForm.fullName || 'Your Name'}
          </p>
          <p className="text-cream/70 text-sm mt-0.5">{currentUser?.email || 'your@email.com'}</p>
          <span className="inline-block mt-2 text-xs font-medium bg-cream/20 text-cream px-2.5 py-0.5 rounded-full">
            Member
          </span>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden mb-5">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-cream-dark bg-cream/40">
          <span className="w-1 h-5 rounded-full bg-green inline-block" />
          <h2 className="font-semibold text-green text-sm uppercase tracking-wide">
            Personal Information
          </h2>
        </div>

        <div className="p-6">
          {profileSuccess && (
            <div className="flex items-center gap-2 bg-green/10 border border-green/20 text-green text-sm rounded-lg px-4 py-2.5 mb-5">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {profileSuccess}
            </div>
          )}
          <form onSubmit={handleProfileSave} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormField
                id="fullName"
                name="fullName"
                label="Full name"
                value={profileForm.fullName}
                onChange={handleProfileChange}
                onBlur={handleProfileBlur}
                error={profileErrors.fullName}
                maxLength={100}
              />
              <FormField
                id="phone"
                name="phone"
                label="Phone number"
                type="tel"
                value={profileForm.phone}
                onChange={handleProfileChange}
                onBlur={handleProfileBlur}
                error={profileErrors.phone}
                maxLength={10}
              />
            </div>
            {/* Email is read-only — cannot be changed */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-green mb-1">Email address</label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" variant="primary" size="sm" loading={profileLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-cream-dark bg-cream/40">
          <span className="w-1 h-5 rounded-full bg-brown inline-block" />
          <h2 className="font-semibold text-brown text-sm uppercase tracking-wide">
            Change Password
          </h2>
        </div>

        <div className="p-6">
          {pwSuccess && (
            <div className="flex items-center gap-2 bg-green/10 border border-green/20 text-green text-sm rounded-lg px-4 py-2.5 mb-5">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {pwSuccess}
            </div>
          )}
          <p className="text-xs text-gray-500 mb-4">
            Password must be at least 8 characters with uppercase, lowercase, a digit, and a special character.
          </p>
          <form onSubmit={handlePwSave} noValidate>
            <FormField
              id="currentPassword"
              name="currentPassword"
              label="Current password"
              type="password"
              value={pwForm.currentPassword}
              onChange={handlePwChange}
              onBlur={handlePwBlur}
              error={pwErrors.currentPassword}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormField
                id="newPassword"
                name="newPassword"
                label="New password"
                type="password"
                value={pwForm.newPassword}
                onChange={handlePwChange}
                onBlur={handlePwBlur}
                error={pwErrors.newPassword}
              />
              <FormField
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm new password"
                type="password"
                value={pwForm.confirmPassword}
                onChange={handlePwChange}
                onBlur={handlePwBlur}
                error={pwErrors.confirmPassword}
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" variant="secondary" size="sm" loading={pwLoading}>
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>

    </div>
  )
}
