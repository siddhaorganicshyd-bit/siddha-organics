/**
 * SMS Service — Fast2SMS
 * Sends OTP SMS to Indian phone numbers.
 * Free tier available at https://www.fast2sms.com
 */

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Send an OTP SMS via Fast2SMS.
 * @param {string} phone - 10-digit Indian number (without +91)
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<{ success: boolean, dev?: boolean, error?: string }>}
 */
export async function sendOTPSMS(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY

  // Dev fallback — no API key configured
  if (!apiKey) {
    console.info(`📱 [DEV] Phone OTP for ${phone}: ${otp}`)
    return { success: true, dev: true, devOtp: otp }
  }

  try {
    const url = 'https://www.fast2sms.com/dev/bulkV2'
    const params = new URLSearchParams({
      authorization: apiKey,
      variables_values: otp,
      route: 'otp',
      numbers: phone,
    })

    const res = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: { 'cache-control': 'no-cache' },
    })

    const data = await res.json()

    if (data.return === true) {
      console.info(`📱 SMS OTP sent to ${phone}`)
      return { success: true }
    }

    console.error('Fast2SMS error:', data.message)
    // Fall back to dev mode so registration isn't blocked
    if (isDev) {
      console.info(`📱 [DEV FALLBACK] Phone OTP for ${phone}: ${otp}`)
      return { success: true, dev: true, devOtp: otp }
    }
    return { success: false, error: 'Failed to send SMS. Please try again.' }
  } catch (err) {
    console.error('SMS send error:', err.message)
    if (isDev) {
      console.info(`📱 [DEV FALLBACK] Phone OTP for ${phone}: ${otp}`)
      return { success: true, dev: true, devOtp: otp }
    }
    return { success: false, error: 'Failed to send SMS. Please try again.' }
  }
}
