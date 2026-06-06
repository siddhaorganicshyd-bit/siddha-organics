# Requirements Document

## Introduction

This document defines the requirements for the OTP (One-Time Password) verification feature for the Siddha Organics e-commerce application. The feature provides two-factor identity verification via email (using Nodemailer + Gmail + Google App Password) and phone (using Firebase Authentication as the primary channel, with Meta WhatsApp Cloud API as an additional channel). OTP verification is required during three user flows: new account signup, login for unverified accounts, and password reset. The system must integrate with the existing Express backend, MongoDB User model, React frontend, and the already-configured Firebase project.

## Glossary

- **OTP**: A 6-digit numeric One-Time Password, valid for a single use within a fixed expiry window of 5 minutes.
- **OTP_Service**: The backend module responsible for generating, storing, validating, and expiring OTPs.
- **Email_Service**: The existing Nodemailer-based backend service (`emailService.js`) that delivers OTP emails via Gmail SMTP using a Google App Password.
- **Firebase_Phone_Auth**: The existing Firebase Authentication client-side service (`firebasePhoneAuth.js`) that sends and verifies phone OTPs via Firebase's free phone authentication quota.
- **WhatsApp_OTP_Service**: A backend service that delivers OTP messages to the user's registered phone number via the Meta WhatsApp Cloud API (free tier: 1,000 service conversations/month). Falls back to Firebase SMS if delivery fails or if Meta credentials are not configured.
- **Meta_Cloud_API**: The Meta WhatsApp Cloud API used by WhatsApp_OTP_Service to send OTP messages.
- **Auth_Controller**: The existing Express controller (`authController.js`) that handles registration, login, and account verification endpoints.
- **OTP_Controller**: A new Express controller that exposes HTTP endpoints for sending and verifying OTPs.
- **Auth_Context**: The existing React context (`AuthContext.jsx`) that manages client-side authentication state and session storage.
- **OTP_Input**: The React UI component that renders the 6-digit OTP entry field (either as six individual digit boxes or a single 6-character input) with loading, error, and success states.
- **OTP_Verification_UI**: The React component(s) presented to the user to enter and submit OTP codes, composed using OTP_Input.
- **Verification_Flow**: The multi-step UI sequence a user completes to verify both email and phone.
- **JWT_Token**: A JSON Web Token issued by the Auth_Controller upon successful account activation, used to authenticate subsequent API requests.
- **User**: A registered customer of the Siddha Organics application.
- **Pending_User**: A User whose account `status` is `pending_verification` in MongoDB.
- **Active_User**: A User whose account `status` is `active`, meaning both `emailVerified` and `phoneVerified` are `true`.
- **Reset_Token**: A server-side OTP record used exclusively for the forgot-password flow, keyed by userId and type `reset`.
- **Resend_Cooldown**: A 30-second client-side countdown timer that prevents the user from requesting a new OTP immediately after the previous request.
- **Rate_Limit**: A server-side constraint on how many OTP send requests a single user or IP address may make within a time window.

---

## Requirements

### Requirement 1: Email OTP Delivery

**User Story:** As a User, I want to receive a 6-digit OTP at my registered email address, so that I can verify my identity during signup, login verification, and password reset.

#### Acceptance Criteria

1. WHEN the OTP_Controller receives a valid send-email-OTP request, THE Email_Service SHALL send an HTML-formatted email containing a 6-digit OTP to the specified address within 10 seconds.
2. WHEN the Email_Service sends an OTP email, THE OTP_Service SHALL store the OTP bcrypt hash, the associated userId, the OTP type (`verification` or `reset`), and an expiry timestamp of 5 minutes from the time of generation.
3. IF the Gmail SMTP credentials (`EMAIL_USER`, `EMAIL_PASS`) are not configured in the environment, THEN THE Email_Service SHALL log the OTP to the server console and return `{ success: true, dev: true }` without throwing an error.
4. WHEN an OTP email is successfully delivered, THE Email_Service SHALL return `{ success: true }` to the caller.
5. IF the Email_Service fails to deliver the email in a production environment, THEN THE OTP_Controller SHALL return HTTP 500 with a descriptive error message and SHALL NOT expose the OTP value in the response body.
6. THE OTP_Service SHALL generate each OTP as a cryptographically random 6-digit numeric string.

---

### Requirement 2: Phone OTP Delivery via Firebase

**User Story:** As a User, I want to receive a 6-digit OTP on my registered Indian mobile number, so that I can verify my phone during signup and login verification.

#### Acceptance Criteria

1. WHEN the user initiates phone OTP sending, THE Firebase_Phone_Auth service SHALL invoke `signInWithPhoneNumber` with the number formatted as `+91{phone}` and an initialized invisible reCAPTCHA verifier.
2. WHEN Firebase successfully dispatches the SMS, THE Firebase_Phone_Auth service SHALL store the `confirmationResult` in module scope for use during verification.
3. IF the Firebase project credentials (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`) are not configured, THEN THE Firebase_Phone_Auth service SHALL generate a 6-digit dev OTP, store it in `sessionStorage` with a 5-minute expiry, log it to the browser console, and return `{ success: true, dev: true, devOtp }`.
4. IF Firebase returns `auth/too-many-requests`, THEN THE Firebase_Phone_Auth service SHALL return `{ success: false, error: 'Too many attempts. Please wait a few minutes and try again.' }`.
5. IF Firebase returns `auth/invalid-phone-number`, THEN THE Firebase_Phone_Auth service SHALL return `{ success: false, error: 'Invalid phone number. Please check and try again.' }`.
6. WHEN a phone OTP send attempt fails, THE Firebase_Phone_Auth service SHALL clear and reset the reCAPTCHA verifier before returning the error response.
7. WHEN the OTP_Verification_UI mounts for phone verification, THE Firebase_Phone_Auth service SHALL initialize an invisible reCAPTCHA verifier bound to a designated DOM container before the first send attempt.

---

### Requirement 3: OTP Verification — Email

**User Story:** As a User, I want to submit the 6-digit code I received by email, so that the system can confirm I own the email address.

#### Acceptance Criteria

1. WHEN the user submits a 6-digit email OTP, THE OTP_Service SHALL compare it against the stored bcrypt hash for the matching userId and type.
2. IF the submitted OTP matches the stored hash and has not expired, THEN THE OTP_Service SHALL mark the OTP record as consumed and return `{ success: true }`.
3. IF the submitted OTP does not match the stored hash, THEN THE OTP_Service SHALL increment the attempt counter for that record and return `{ success: false, error: 'Incorrect OTP. Please try again.' }`.
4. IF the attempt counter for an OTP record reaches 3 failed attempts, THEN THE OTP_Service SHALL invalidate the record and return `{ success: false, error: 'Too many incorrect attempts. Please request a new OTP.' }`.
5. IF the OTP record has expired (more than 5 minutes since generation), THEN THE OTP_Service SHALL invalidate the record and return `{ success: false, error: 'OTP has expired. Please request a new one.' }`.
6. IF no OTP record exists for the given userId and type, THEN THE OTP_Service SHALL return `{ success: false, error: 'OTP not found. Please request a new one.' }`.

---

### Requirement 4: OTP Verification — Phone

**User Story:** As a User, I want to submit the 6-digit code I received by SMS, so that the system can confirm I own the phone number.

#### Acceptance Criteria

1. WHEN the user submits a 6-digit phone OTP, THE Firebase_Phone_Auth service SHALL call `confirmationResult.confirm(otp)` to verify the code with Firebase.
2. IF Firebase confirms the OTP successfully, THEN THE Firebase_Phone_Auth service SHALL clear the stored `confirmationResult` and return `{ success: true }`.
3. IF Firebase returns `auth/invalid-verification-code`, THEN THE Firebase_Phone_Auth service SHALL return `{ success: false, error: 'Incorrect OTP. Please try again.' }`.
4. IF Firebase returns `auth/code-expired` or `auth/session-expired`, THEN THE Firebase_Phone_Auth service SHALL return `{ success: false, error: 'OTP has expired. Please request a new one.' }`.
5. IF `confirmationResult` is null when verification is attempted, THEN THE Firebase_Phone_Auth service SHALL return `{ success: false, error: 'Session expired. Please request a new OTP.' }`.
6. WHERE Firebase is not configured (dev mode), THE Firebase_Phone_Auth service SHALL verify the OTP against the value stored in `sessionStorage`, enforce the 5-minute expiry, and apply the same match logic as production.

---

### Requirement 5: Account Activation and JWT Issuance After Dual Verification

**User Story:** As a Pending_User, I want my account to be activated automatically once I verify both my email and phone, so that I am logged in immediately without needing to visit the login page separately.

#### Acceptance Criteria

1. WHEN the OTP_Controller receives a verified notification for type `email`, THE Auth_Controller SHALL set `emailVerified = true` on the User document in MongoDB.
2. WHEN the OTP_Controller receives a verified notification for type `phone`, THE Auth_Controller SHALL set `phoneVerified = true` on the User document in MongoDB.
3. WHEN both `emailVerified` and `phoneVerified` are `true` on a User document, THE Auth_Controller SHALL set the User's `status` to `active`.
4. WHILE a User's `status` is `pending_verification`, THE Auth_Controller SHALL reject login attempts with HTTP 403 and `{ error: 'Account not verified.', needsVerification: true, userId }`.
5. WHEN a User's `status` transitions to `active`, THE Auth_Controller SHALL generate a JWT_Token for the newly activated User and return `{ success: true, user, token }` in the verification response so the frontend can establish an authenticated session without a separate login request.
6. IF only one of `emailVerified` or `phoneVerified` is `true`, THEN THE Auth_Controller SHALL keep the User's `status` as `pending_verification` and SHALL NOT issue a JWT_Token.

---

### Requirement 6: Signup Verification Flow (UI)

**User Story:** As a new User, I want to be guided through email and phone OTP entry immediately after registration, so that I can activate my account in a single session.

#### Acceptance Criteria

1. WHEN registration succeeds, THE OTP_Verification_UI SHALL display two verification panels — one for email and one for phone — each containing an OTP_Input component and a Verify button.
2. WHEN the user successfully verifies email, THE OTP_Verification_UI SHALL mark the email panel as verified with a visual confirmation indicator and disable further input for that panel.
3. WHEN the user successfully verifies phone, THE OTP_Verification_UI SHALL mark the phone panel as verified with a visual confirmation indicator and disable further input for that panel.
4. WHILE either email or phone is unverified, THE OTP_Verification_UI SHALL keep the "Complete Registration" button disabled.
5. WHEN both email and phone are verified and the Auth_Controller returns a JWT_Token, THE OTP_Verification_UI SHALL save the token and user to the Auth_Context session and redirect the user to the home page, bypassing the login page.
6. IF the user navigates to `/register` with `location.state.needsVerification = true`, THEN THE OTP_Verification_UI SHALL skip the registration form and display the verification panels directly, re-sending OTPs to the stored email and phone.

---

### Requirement 7: OTP Input Component

**User Story:** As a User, I want a clear and responsive OTP entry interface, so that I can enter my verification code quickly and understand the current state of the verification process.

#### Acceptance Criteria

1. THE OTP_Input component SHALL render a 6-digit entry field, implemented as either six individual single-digit input boxes or a single 6-character input field, accepting only numeric characters.
2. WHILE an OTP verification request is in flight, THE OTP_Input component SHALL display a loading indicator and disable the input field and the associated Verify button.
3. IF the OTP_Service or Firebase_Phone_Auth returns a verification error, THEN THE OTP_Input component SHALL display the error message below the input field with a visually distinct error style.
4. WHEN the OTP is successfully verified, THE OTP_Input component SHALL display a success state (e.g., a checkmark or green border) and disable the input field.
5. WHEN the user clears or modifies the OTP input field after an error, THE OTP_Input component SHALL clear the displayed error message.

---

### Requirement 8: Resend OTP with Countdown Timer

**User Story:** As a User, I want to request a new OTP if I did not receive the previous one or if it expired, so that I can complete verification without starting over.

#### Acceptance Criteria

1. WHEN the user clicks "Resend OTP", THE OTP_Verification_UI SHALL trigger a new OTP send request and start a 30-second Resend_Cooldown timer.
2. WHILE the Resend_Cooldown timer is active, THE OTP_Verification_UI SHALL disable the resend button and display the remaining seconds in the button label (e.g., "Resend in 28s").
3. WHEN the Resend_Cooldown timer reaches zero, THE OTP_Verification_UI SHALL re-enable the resend button and restore its default label (e.g., "Resend OTP").
4. WHEN a new OTP is generated for a userId and type that already has an active record, THE OTP_Service SHALL replace the previous record with the new OTP and reset the expiry and attempt counter.
5. THE OTP_Service SHALL enforce a server-side Rate_Limit of no more than 5 OTP send requests per userId per 15-minute window for each OTP type.
6. IF the Rate_Limit is exceeded, THEN THE OTP_Controller SHALL return HTTP 429 with `{ error: 'Too many OTP requests. Please wait before trying again.' }`.

---

### Requirement 9: WhatsApp OTP Delivery via Meta Cloud API

**User Story:** As a User, I want to optionally receive my OTP via WhatsApp, so that I have an additional delivery channel if SMS is unavailable or delayed.

#### Acceptance Criteria

1. WHERE Meta WhatsApp Cloud API credentials (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`) are configured, THE WhatsApp_OTP_Service SHALL send the OTP to the user's registered phone number using the Meta Cloud API before attempting Firebase SMS.
2. WHEN the Meta Cloud API successfully delivers the OTP message, THE WhatsApp_OTP_Service SHALL return `{ success: true, channel: 'whatsapp' }` to the caller.
3. IF the Meta Cloud API call fails for any reason, THEN THE WhatsApp_OTP_Service SHALL fall back to Firebase SMS delivery and return `{ success: true, channel: 'sms', fallback: true }`.
4. IF Meta credentials are not configured in the environment, THEN THE WhatsApp_OTP_Service SHALL operate in dev mode: log the OTP to the server console and return `{ success: true, dev: true }` without attempting any external delivery.
5. THE WhatsApp_OTP_Service SHALL format the OTP message as a plain-text template containing the 6-digit code and the application name (e.g., "Your Siddha Organics verification code is: 123456. Valid for 5 minutes.").
6. THE WhatsApp_OTP_Service SHALL NOT exceed the Meta Cloud API free tier limit of 1,000 service conversations per month; the system operator is responsible for monitoring usage.

---

### Requirement 10: Forgot Password OTP Flow

**User Story:** As a User who has forgotten their password, I want to receive an OTP at my registered email address, so that I can verify my identity and set a new password.

#### Acceptance Criteria

1. WHEN the user submits a valid registered email on the forgot-password form, THE Auth_Controller SHALL look up the User by email, generate a Reset_Token OTP, and invoke the Email_Service to send it.
2. IF the submitted email is not found in the database, THEN THE Auth_Controller SHALL return the same success response as a found email to prevent account enumeration.
3. WHEN the user submits the correct Reset_Token OTP, THE OTP_Service SHALL validate it and return `{ success: true, userId }` so the frontend can proceed to the new-password step.
4. WHEN the user submits a new password after successful Reset_Token verification, THE Auth_Controller SHALL hash the new password and update the User document, then invalidate the Reset_Token.
5. IF the Reset_Token OTP has expired (more than 5 minutes since generation) or been consumed, THEN THE OTP_Service SHALL return `{ success: false, error: 'Reset code expired. Please request a new one.' }`.
6. THE Auth_Controller SHALL enforce a minimum password length of 8 characters and require at least one uppercase letter, one lowercase letter, one digit, and one special character before accepting a password reset.
7. WHEN a password reset is completed successfully, THE Auth_Controller SHALL return `{ success: true }` and the frontend SHALL redirect the user to the login page.

---

### Requirement 11: Security Constraints

**User Story:** As the system operator, I want OTP flows to be resistant to brute-force, replay, and data-exposure attacks, so that user accounts and credentials remain secure.

#### Acceptance Criteria

1. THE OTP_Service SHALL store all OTPs exclusively as bcrypt hashes immediately upon generation. Plain-text OTP values SHALL NEVER be persisted to the database or any in-memory store.
2. WHEN an OTP is successfully verified, THE OTP_Service SHALL immediately invalidate the record so the same OTP cannot be used again.
3. THE OTP_Service SHALL enforce a hard limit of 3 verification attempts per OTP record. WHEN the attempt counter reaches 3 failed attempts, THE OTP_Service SHALL invalidate the record and require the user to request a new OTP.
4. THE OTP_Controller SHALL enforce a Rate_Limit of no more than 5 OTP send requests per IP address per 15-minute window across all OTP types.
5. IF a request to send or verify an OTP does not include a valid `userId` that exists in the database, THEN THE OTP_Controller SHALL return HTTP 404 without revealing whether the userId exists.
6. THE OTP_Service SHALL generate OTPs using a cryptographically secure random number generator.
7. WHEN `NODE_ENV` is `production`, THE OTP_Controller SHALL NEVER include the OTP value in any API response body, HTTP response header, or server log entry. Inclusion of a plain-text OTP in any production API response or log is a critical security defect.
8. THE OTP_Service SHALL set all OTP records to expire 5 minutes after generation. Expiry windows longer than 5 minutes are not permitted.

---

### Requirement 12: Developer and Test Mode

**User Story:** As a developer, I want the OTP system to work without real email, Firebase, or WhatsApp credentials during local development, so that I can test all verification flows without external service dependencies.

#### Acceptance Criteria

1. IF `EMAIL_USER` or `EMAIL_PASS` environment variables are absent, THEN THE Email_Service SHALL operate in dev mode: log the OTP to the server console and return `{ success: true, dev: true }`.
2. IF Firebase credentials are absent, THEN THE Firebase_Phone_Auth service SHALL operate in dev mode: generate a 6-digit OTP, store it in `sessionStorage` with a 5-minute expiry, log it to the browser console, and return `{ success: true, dev: true, devOtp }`.
3. IF Meta WhatsApp Cloud API credentials are absent, THEN THE WhatsApp_OTP_Service SHALL operate in dev mode: log the OTP to the server console and return `{ success: true, dev: true }`.
4. WHEN any backend OTP send endpoint returns `{ dev: true }`, THE OTP_Verification_UI SHALL display a clearly labelled dev-mode banner showing the OTP code so the developer can complete the flow.
5. WHEN `NODE_ENV` is `production`, THE OTP_Controller SHALL NOT return OTP values in any API response body.
6. WHERE dev mode is active, THE OTP_Service SHALL accept OTP verification using the same code paths as production, ensuring dev-mode testing exercises the real verification logic.
