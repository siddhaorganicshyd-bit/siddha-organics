# Implementation Plan: OTP Verification

## Overview

This implementation plan converts the OTP verification design into discrete coding tasks. The feature provides two-factor identity verification via email (Nodemailer + Gmail SMTP) and phone (Firebase Authentication client-side + Meta WhatsApp Cloud API backend). The implementation follows a bottom-up approach: data layer → services → controllers → routes → frontend components → integration.

## Tasks

- [x] 1. Install backend dependencies and set up data layer
  - Install `express-rate-limit` as a backend dependency
  - Create OtpRecord Mongoose model at `backend/src/models/OtpRecord.js`
  - Define schema with fields: userId, type, channel, otpHash, expiresAt, attempts, consumed
  - Add compound unique index on `{ userId, type, channel }`
  - Add TTL index on `expiresAt` with `expireAfterSeconds: 0`
  - Export OtpRecord from `backend/src/models/index.js`
  - _Requirements: 1.2, 11.1, 11.8_

- [x] 2. Implement OTP service (core business logic)
  - [x] 2.1 Create `backend/src/services/otpService.js` with core functions
    - Implement `generateOTP()` — returns 6-digit numeric string using crypto.randomInt
    - Implement `createOTPRecord(userId, type, channel)` — generates OTP, hashes with bcrypt (cost 10), upserts record with 5-min expiry
    - Implement `verifyOTPRecord(userId, type, channel, otp)` — validates OTP, checks expiry, enforces 3-attempt limit, marks consumed
    - Implement `invalidateOTPRecord(userId, type, channel)` — deletes or marks consumed
    - _Requirements: 1.6, 1.2, 3.1, 3.2, 3.3, 3.4, 3.5, 11.1, 11.2, 11.3, 11.6, 11.8_

  - [ ]* 2.2 Write property test for generateOTP format validity
    - **Property 1: OTP Format Validity**
    - **Validates: Requirements 1.6, 11.6**
    - Test that all generated OTPs match `/^\d{6}$/` and are in range [100000, 999999]
    - Use fast-check with 100 iterations

  - [ ]* 2.3 Write property test for OTP record integrity
    - **Property 2: OTP Record Integrity**
    - **Validates: Requirements 1.2, 11.1, 11.8**
    - Test that stored records have bcrypt hash, correct metadata, 5-min expiry
    - Verify otpHash !== plainOtp, bcrypt.compare succeeds, consumed=false, attempts=0

  - [ ]* 2.4 Write property test for OTP verification round-trip
    - **Property 3: OTP Verification Round-Trip**
    - **Validates: Requirements 3.1, 3.2**
    - Test that createOTPRecord → verifyOTPRecord with correct OTP succeeds and consumes record

  - [ ]* 2.5 Write property test for single-use OTP
    - **Property 4: Single-Use OTP**
    - **Validates: Requirements 11.2**
    - Test that verified OTP cannot be used again

  - [ ]* 2.6 Write property test for wrong OTP increments attempts
    - **Property 5: Wrong OTP Increments Attempt Counter**
    - **Validates: Requirements 3.3**
    - Test that incorrect OTP increments attempts field by exactly 1

  - [ ]* 2.7 Write property test for attempt lockout
    - **Property 6: Attempt Lockout After 3 Failures**
    - **Validates: Requirements 3.4, 11.3**
    - Test that after 3 wrong attempts, correct OTP also fails

  - [ ]* 2.8 Write property test for OTP expiry enforcement
    - **Property 7: OTP Expiry Enforcement**
    - **Validates: Requirements 3.5, 11.8**
    - Test that expired OTP record fails verification regardless of correctness

  - [ ]* 2.9 Write property test for OTP upsert behavior
    - **Property 8: OTP Upsert Replaces Previous Record**
    - **Validates: Requirements 8.4**
    - Test that second createOTPRecord invalidates first OTP

- [x] 3. Implement WhatsApp service (Meta Cloud API integration)
  - Create `backend/src/services/whatsappService.js`
  - Implement `sendWhatsAppOTP(phone, otp)` function
  - Use Meta WhatsApp Cloud API with `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` env vars
  - Format message as plain text template with 6-digit code
  - Return `{ success: true, channel: 'whatsapp' }` on success
  - Fall back to dev mode (console log) if credentials absent: `{ success: true, dev: true }`
  - Fall back to Firebase SMS if Meta API call fails: `{ success: true, channel: 'sms', fallback: true }`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Implement OTP controller (HTTP handlers)
  - [x] 4.1 Create `backend/src/controllers/otpController.js` with all endpoints
    - Implement `sendEmailOTP(req, res)` — validates userId/type, calls otpService.createOTPRecord, calls emailService.sendOTPEmail
    - Implement `sendPhoneOTP(req, res)` — validates userId, calls otpService.createOTPRecord, calls whatsappService.sendWhatsAppOTP
    - Implement `verifyEmailOTP(req, res)` — validates userId/otp/type, calls otpService.verifyOTPRecord, updates User.emailVerified, checks dual verification, issues JWT if both verified
    - Implement `verifyPhoneOTP(req, res)` — validates userId, updates User.phoneVerified (Firebase verified client-side), checks dual verification, issues JWT if both verified
    - Implement `forgotPassword(req, res)` — looks up user by email, creates reset OTP, sends email (anti-enumeration: same response for unknown email)
    - Implement `verifyReset(req, res)` — validates reset OTP, returns userId on success
    - Implement `resetPassword(req, res)` — validates password complexity, updates User.passwordHash, invalidates reset OTP
    - All endpoints return 404 for unknown userId, 400 for validation errors, 422 for OTP errors
    - Never include plain OTP in production responses (check `NODE_ENV`)
    - _Requirements: 1.1, 1.4, 1.5, 3.1-3.6, 4.1-4.6, 5.1-5.6, 10.1-10.7, 11.5, 11.7_

  - [ ]* 4.2 Write property test for dual verification activates account
    - **Property 9: Dual Verification Activates Account and Issues JWT**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**
    - Test that after both email and phone verification, user.status='active' and JWT is returned

  - [ ]* 4.3 Write property test for partial verification no JWT
    - **Property 10: Partial Verification Does Not Issue JWT**
    - **Validates: Requirements 5.6**
    - Test that single-channel verification does not issue JWT

  - [ ]* 4.4 Write property test for anti-enumeration
    - **Property 12: Anti-Enumeration on Forgot Password**
    - **Validates: Requirements 10.2**
    - Test that unknown email returns same response as known email

  - [ ]* 4.5 Write property test for password reset updates credentials
    - **Property 13: Password Reset Updates Credentials**
    - **Validates: Requirements 10.4**
    - Test that resetPassword updates hash and invalidates reset token

  - [ ]* 4.6 Write property test for password complexity enforcement
    - **Property 14: Password Complexity Enforcement**
    - **Validates: Requirements 10.6**
    - Test that invalid passwords are rejected by resetPassword

  - [ ]* 4.7 Write property test for no OTP in production responses
    - **Property 15: No Plain OTP in Production Responses**
    - **Validates: Requirements 11.7, 1.5**
    - Test that production responses never contain plain OTP

  - [ ]* 4.8 Write property test for invalid userId returns 404
    - **Property 16: Invalid UserId Returns 404**
    - **Validates: Requirements 11.5**
    - Test that non-existent userId returns 404

- [x] 5. Update OTP routes with rate limiting
  - Replace existing `backend/src/routes/otp.js` with new implementation
  - Import `express-rate-limit` and create two limiters: sendLimiter (5 req/15min), verifyLimiter (10 req/15min)
  - Define routes with rate limiting middleware:
    - POST `/send/email` → sendLimiter → otpController.sendEmailOTP
    - POST `/send/phone` → sendLimiter → otpController.sendPhoneOTP
    - POST `/verify/email` → verifyLimiter → otpController.verifyEmailOTP
    - POST `/verify/phone` → verifyLimiter → otpController.verifyPhoneOTP
    - POST `/forgot-password` → sendLimiter → otpController.forgotPassword
    - POST `/verify-reset` → verifyLimiter → otpController.verifyReset
    - POST `/reset-password` → verifyLimiter → otpController.resetPassword
  - _Requirements: 8.5, 8.6, 11.4_

- [x] 6. Update authController to enforce pending verification
  - Modify `backend/src/controllers/authController.js` login function
  - Add check: if `user.status === 'pending_verification'`, return HTTP 403 with `{ error: '...', needsVerification: true, userId }`
  - Update `verifyOTP` function to issue JWT when both emailVerified and phoneVerified are true
  - _Requirements: 5.4, 5.5_

- [ ]* 6.1 Write property test for pending user login rejected
  - **Property 11: Pending User Login Rejected**
  - **Validates: Requirements 5.4**
  - Test that pending_verification user login returns 403

- [x] 7. Checkpoint — Backend implementation complete
  - Ensure all backend tests pass
  - Verify MongoDB indexes are created
  - Test rate limiting with multiple requests
  - Ask the user if questions arise

- [x] 8. Create OtpInput component (frontend UI)
  - Create `frontend/src/components/ui/OtpInput.jsx`
  - Render 6 individual input boxes, each accepting a single digit
  - Props: value (string), onChange (callback), loading (boolean), error (string|null), success (boolean), disabled (boolean)
  - Implement auto-focus on digit entry and backspace navigation
  - Implement paste support for 6-digit strings
  - Use `inputmode="numeric"` for mobile keyboards
  - Add `aria-label="Digit N of 6"` for accessibility
  - Display error message below boxes with `aria-describedby`
  - Show loading spinner when loading=true
  - Show green success state when success=true
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 8.1 Write unit tests for OtpInput component
  - Test rendering 6 input boxes
  - Test numeric-only filtering
  - Test auto-focus behavior
  - Test paste support
  - Test loading, error, and success states

- [x] 9. Create frontend OTP service (API wrappers)
  - Create `frontend/src/services/otpService.js`
  - Implement thin fetch wrappers for all OTP endpoints:
    - `sendEmailOTP(userId, type)` → POST `/api/otp/send/email`
    - `sendPhoneOTP(userId)` → POST `/api/otp/send/phone`
    - `verifyEmailOTP(userId, otp, type)` → POST `/api/otp/verify/email`
    - `verifyPhoneOTP(userId)` → POST `/api/otp/verify/phone`
    - `forgotPassword(email)` → POST `/api/otp/forgot-password`
    - `verifyReset(userId, otp)` → POST `/api/otp/verify-reset`
    - `resetPassword(userId, newPassword)` → POST `/api/otp/reset-password`
  - All functions return `{ success, ...data }` or `{ success: false, error }`
  - Handle network errors gracefully
  - _Requirements: 1.1, 3.1, 4.1, 10.1_

- [x] 10. Update AuthContext to support session activation
  - Modify `frontend/src/contexts/AuthContext.jsx`
  - Update `activateSession(user, token)` function to save token to localStorage using `saveSession(token, user)`
  - Ensure token is persisted so user is logged in after verification
  - _Requirements: 5.5, 6.5_

- [x] 11. Create VerifyAccountPage (dual-panel verification UI)
  - Create `frontend/src/pages/user/VerifyAccountPage.jsx`
  - Require `location.state.userId`, `location.state.email`, `location.state.phone` from navigation
  - Render two panels: Email Verification + Phone Verification
  - Each panel contains: OtpInput component, Verify button, Resend button with 30s countdown
  - Email panel: calls `otpService.sendEmailOTP` on mount and resend, calls `otpService.verifyEmailOTP` on verify
  - Phone panel: calls `firebasePhoneAuth.sendPhoneOTP` on mount and resend, calls `firebasePhoneAuth.verifyPhoneOTP` on verify, then calls `otpService.verifyPhoneOTP` to notify backend
  - Initialize invisible reCAPTCHA for phone verification using `firebasePhoneAuth.initRecaptcha('recaptcha-container')`
  - Display dev-mode banners when `dev: true` is returned from API
  - Mark each panel as verified with visual indicator when successful
  - Enable "Complete Registration" button only when both panels verified
  - On completion, call `AuthContext.activateSession(user, token)` and redirect to `/`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 12.4_

- [x] 12. Create ForgotPasswordPage (3-step wizard)
  - Create `frontend/src/pages/user/ForgotPasswordPage.jsx`
  - Step 1: Email input form → calls `otpService.forgotPassword(email)` → stores userId in state
  - Step 2: OtpInput for reset code → calls `otpService.verifyReset(userId, otp)` → proceeds to step 3 on success
  - Step 3: New password + confirm password form → validates complexity, calls `otpService.resetPassword(userId, newPassword)` → redirects to `/login` on success
  - Display step indicator with `aria-current="step"` for accessibility
  - Show dev-mode banner if `devOtp` is returned
  - _Requirements: 10.1, 10.3, 10.4, 10.6, 10.7_

- [x] 13. Update RegisterPage to redirect to VerifyAccountPage
  - Modify `frontend/src/pages/user/RegisterPage.jsx`
  - After successful registration, navigate to `/verify-account` with `state: { userId, email, phone }`
  - If registration returns `needsVerification: true`, also navigate to `/verify-account` with same state
  - Remove inline OTP verification UI from RegisterPage (move to VerifyAccountPage)
  - _Requirements: 6.1, 6.6_

- [x] 14. Add routes to frontend router
  - Modify `frontend/src/router/index.jsx`
  - Add lazy import for VerifyAccountPage and ForgotPasswordPage
  - Add routes under PublicLayout:
    - `{ path: 'verify-account', element: withSuspense(VerifyAccountPage) }`
    - `{ path: 'forgot-password', element: withSuspense(ForgotPasswordPage) }`
  - _Requirements: 6.1, 10.1_

- [x] 15. Final checkpoint — Integration testing
  - Test complete signup flow: register → verify email → verify phone → redirect to home
  - Test forgot password flow: email → OTP → new password → login
  - Test rate limiting: send 6 OTP requests, verify 429 response
  - Test dev mode: remove credentials, verify OTP appears in console/banner
  - Test pending user login: attempt login before verification, verify 403 response
  - Ensure all tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Backend uses JavaScript with Mongoose, Express, bcrypt, Nodemailer
- Frontend uses JavaScript with React, Tailwind CSS, Firebase Auth, fast-check for testing
- All OTP values are hashed with bcrypt before storage (never stored in plain text)
- Rate limiting is enforced at the route level using express-rate-limit
- Dev mode fallbacks are implemented for all external services (email, WhatsApp, Firebase)
