import React, { useRef, useId } from 'react'
import { Spinner } from './Spinner'

const OTP_LENGTH = 6

/**
 * OtpInput — 6-box OTP entry component.
 *
 * Props:
 *   value    {string}        — current 6-digit string (controlled)
 *   onChange {(otp) => void} — called with new value on each change
 *   loading  {boolean}       — disables input and shows spinner
 *   error    {string|null}   — error message shown below boxes
 *   success  {boolean}       — shows green success state
 *   disabled {boolean}       — fully disables the component
 */
export default function OtpInput({
  value = '',
  onChange,
  loading = false,
  error = null,
  success = false,
  disabled = false,
}) {
  const inputRefs = useRef([])
  const errorId = useId()

  const isDisabled = disabled || loading

  // Normalise value to an array of OTP_LENGTH single-char strings
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '')

  function updateValue(nextDigits) {
    onChange?.(nextDigits.join(''))
  }

  function handleChange(e, index) {
    const raw = e.target.value

    // Accept only the last typed character and ensure it is a digit
    const char = raw.replace(/\D/g, '').slice(-1)

    const nextDigits = [...digits]
    nextDigits[index] = char
    updateValue(nextDigits)

    // Move focus forward when a digit was entered
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(e, index) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // Clear current box
        const nextDigits = [...digits]
        nextDigits[index] = ''
        updateValue(nextDigits)
      } else if (index > 0) {
        // Move focus to previous box and clear it
        const nextDigits = [...digits]
        nextDigits[index - 1] = ''
        updateValue(nextDigits)
        inputRefs.current[index - 1]?.focus()
      }
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return

    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? '')
    updateValue(nextDigits)

    // Focus the box after the last pasted digit (or the last box)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  function handleFocus(e) {
    // Select existing content so typing replaces it naturally
    e.target.select()
  }

  // Box border/background classes based on state
  function boxClasses(index) {
    const base =
      'w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold rounded-lg border-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1'

    if (isDisabled) {
      return `${base} border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed`
    }
    if (success) {
      return `${base} border-green bg-green/10 text-green focus:ring-green`
    }
    if (error) {
      return `${base} border-red-400 bg-red-50 text-gray-800 focus:ring-red-400`
    }
    return `${base} border-gray-300 bg-white text-gray-800 focus:ring-green focus:border-green`
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Success announcement for screen readers */}
      {success && (
        <span role="status" className="sr-only">
          OTP verified successfully.
        </span>
      )}

      <div
        className="flex items-center gap-2 sm:gap-3"
        aria-busy={loading}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            disabled={isDisabled}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
            aria-describedby={error ? errorId : undefined}
            autoComplete="one-time-code"
            className={boxClasses(index)}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={handleFocus}
          />
        ))}

        {loading && (
          <Spinner size="sm" className="ml-2 text-green" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-500 text-center"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}
