/**
 * Email Service — Nodemailer
 * Sends OTP emails for verification/password reset and order confirmation emails.
 */

import nodemailer from 'nodemailer'

const isDev = process.env.NODE_ENV !== 'production'

// Create reusable transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

/**
 * Send an OTP email to the user.
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {'verification' | 'reset'} type
 * @returns {Promise<{ success: boolean, dev?: boolean, error?: string }>}
 */
export async function sendOTPEmail(to, otp, type = 'verification') {
  const isVerification = type === 'verification'

  const subject = isVerification
    ? 'Verify your Siddha Organics account'
    : 'Reset your Siddha Organics password'

  const heading = isVerification ? 'Email Verification' : 'Password Reset'
  const message = isVerification
    ? 'Use the code below to verify your email address and activate your account.'
    : 'Use the code below to reset your password. This code expires in 10 minutes.'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f6f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2d4a1e; font-size: 24px; margin: 0;">Siddha Organics</h1>
        <p style="color: #666; margin: 4px 0 0;">Natural & Organic Products</p>
      </div>
      <div style="background: #fff; border-radius: 8px; padding: 24px; text-align: center;">
        <h2 style="color: #2d4a1e; margin-top: 0;">${heading}</h2>
        <p style="color: #555; line-height: 1.6;">${message}</p>
        <div style="background: #f0f7ec; border: 2px dashed #4a7c2f; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2d4a1e;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
      <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 16px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `

  // If no email credentials configured, fall back to dev mode
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.info(`📧 [DEV] OTP for ${to}: ${otp}`)
    return { success: true, dev: true }
  }

  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from: `"Siddha Organics" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })
    console.info(`📧 OTP email sent to ${to}`)
    return { success: true }
  } catch (err) {
    console.error(`❌ Failed to send OTP email to ${to}:`, err.message)
    // In dev, fall back gracefully
    if (isDev) {
      console.info(`📧 [DEV FALLBACK] OTP for ${to}: ${otp}`)
      return { success: true, dev: true }
    }
    return { success: false, error: 'Failed to send email. Please try again.' }
  }
}


/**
 * Send an order confirmation email to the customer.
 * @param {string} to - recipient email
 * @param {object} order - the created order document
 * @returns {Promise<{ success: boolean, dev?: boolean, error?: string }>}
 */
export async function sendOrderConfirmationEmail(to, order) {
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${item.productName}${item.variantLabel ? ` (${item.variantLabel})` : ''}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.lineTotal / 100).toFixed(2)}</td>
      </tr>`
    )
    .join('')

  const addr = order.shippingAddress
  const addressStr = `${addr.fullName}, ${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.city}, ${addr.state} - ${addr.pinCode}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f6f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px; background: #2d4a1e; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; font-size: 24px; margin: 0;">Siddha Organics</h1>
        <p style="color: #c8e6c0; margin: 4px 0 0;">Natural & Organic Products</p>
      </div>
      <div style="background: #fff; border-radius: 0 0 8px 8px; padding: 24px;">
        <h2 style="color: #2d4a1e; margin-top: 0;">Order Confirmed! 🎉</h2>
        <p style="color: #555; line-height: 1.6;">Thank you for your order. Here's a summary of your purchase:</p>

        <div style="background: #f0f7ec; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #333;"><strong>Order ID:</strong> ${order._id || order.id}</p>
          <p style="margin: 4px 0; color: #333;"><strong>Date:</strong> ${orderDate}</p>
          <p style="margin: 4px 0; color: #333;"><strong>Estimated Delivery:</strong> ${order.estimatedDelivery || 'Within 5-7 business days'}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #f0f7ec;">
              <th style="padding: 8px 12px; text-align: left; color: #2d4a1e;">Item</th>
              <th style="padding: 8px 12px; text-align: center; color: #2d4a1e;">Qty</th>
              <th style="padding: 8px 12px; text-align: right; color: #2d4a1e;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="text-align: right; margin: 16px 0; padding: 12px; background: #f0f7ec; border-radius: 8px;">
          <p style="margin: 4px 0; color: #333;"><strong>Total: ₹${(order.total / 100).toFixed(2)}</strong></p>
        </div>

        <div style="margin: 16px 0; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <p style="margin: 0 0 4px; color: #2d4a1e; font-weight: bold;">Shipping Address</p>
          <p style="margin: 0; color: #555; line-height: 1.5;">${addressStr}</p>
        </div>

        <p style="color: #555; line-height: 1.6; margin-top: 20px;">If you have any questions, reply to this email or contact us at support@siddhaorganics.com.</p>
      </div>
      <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 16px;">
        This is an automated email from Siddha Organics. Please do not reply directly.
      </p>
    </div>
  `

  // If no email credentials configured, fall back to dev mode
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.info(`📧 [DEV] Order confirmation for ${to} — Order ${order._id || order.id}`)
    return { success: true, dev: true }
  }

  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from: `"Siddha Organics" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Order Confirmed — ${order._id || order.id}`,
      html,
    })
    console.info(`📧 Order confirmation email sent to ${to}`)
    return { success: true }
  } catch (err) {
    console.error(`❌ Failed to send order confirmation email to ${to}:`, err.message)
    if (isDev) {
      console.info(`📧 [DEV FALLBACK] Order confirmation for ${to} — Order ${order._id || order.id}`)
      return { success: true, dev: true }
    }
    return { success: false, error: 'Failed to send confirmation email.' }
  }
}
