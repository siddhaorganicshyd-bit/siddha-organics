/**
 * WhatsApp Service — Meta WhatsApp Cloud API
 * Delivers OTP messages to users via WhatsApp.
 * Falls back to Firebase SMS (signalled by caller) if delivery fails or credentials are absent.
 *
 * Meta Cloud API docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 * Free tier: 1,000 service conversations per month.
 */

const META_API_VERSION = 'v18.0'

/**
 * Send an OTP via the Meta WhatsApp Cloud API.
 *
 * Dev mode (no credentials): logs OTP to console and returns { success: true, dev: true }.
 * Production success: returns { success: true, channel: 'whatsapp' }.
 * Production failure: logs error and returns { success: true, channel: 'sms', fallback: true }
 *   so the caller can fall back to Firebase SMS delivery.
 *
 * @param {string} phone - Recipient phone number in E.164 format (e.g. "919876543210")
 * @param {string} otp   - 6-digit OTP code to deliver
 * @returns {Promise<{ success: boolean, channel?: 'whatsapp'|'sms', fallback?: boolean, dev?: boolean }>}
 */
export async function sendWhatsAppOTP(phone, otp) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  // Dev mode — credentials not configured
  if (!token || !phoneNumberId) {
    console.info(`💬 [DEV] WhatsApp OTP for ${phone}: ${otp}`)
    return { success: true, dev: true }
  }

  const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`

  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: {
      body: `Your Siddha Organics verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
    },
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      console.info(`💬 WhatsApp OTP sent to ${phone}`)
      return { success: true, channel: 'whatsapp' }
    }

    // Non-2xx response — log and fall back to Firebase SMS
    const errorData = await res.json().catch(() => ({}))
    console.error(`❌ WhatsApp API error (${res.status}):`, errorData)
    return { success: true, channel: 'sms', fallback: true }
  } catch (err) {
    console.error('❌ WhatsApp send error:', err.message)
    return { success: true, channel: 'sms', fallback: true }
  }
}
