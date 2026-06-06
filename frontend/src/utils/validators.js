/**
 * Validates an email address using an RFC 5322-like regex.
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
  return re.test(email)
}

// Known disposable / fake email domains to block
const BLOCKED_EMAIL_DOMAINS = new Set([
  'test.com', 'example.com', 'fake.com', 'dummy.com', 'temp.com',
  'mailinator.com', 'guerrillamail.com', 'throwaway.email', 'yopmail.com',
  'trashmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.net',
  'guerrillamail.org', 'spam4.me', 'dispostable.com', 'mailnull.com',
  'spamgourmet.com', 'trashmail.at', 'trashmail.io', 'trashmail.me',
  'discard.email', 'fakeinbox.com', 'tempmail.com', 'tempr.email',
  'getairmail.com', 'filzmail.com', 'throwam.com', 'spamherelots.com',
  'maildrop.cc', 'spamfree24.org', 'spamfree.eu', 'spamgob.com',
  'nomail.xl.cx', 'no-spam.ws', 'nospam.ze.tc', 'nospam4.us',
  'spamspot.com', 'spamthis.co.uk', 'spamtroll.net', 'speed.1s.fr',
  'suremail.info', 'sweetxxx.de', 'tafmail.com', 'tagyourself.com',
  'teleworm.us', 'tempalias.com', 'tempinbox.co.uk', 'tempinbox.com',
  'tempsky.com', 'tempthe.net', 'tempymail.com', 'thanksnospam.info',
  'thisisnotmyrealemail.com', 'throwam.com', 'tilien.com', 'tittbit.in',
  'tizi.com', 'tmailinator.com', 'toiea.com', 'tradermail.info',
  'trash-mail.at', 'trash-mail.cf', 'trash-mail.ga', 'trash-mail.gq',
  'trash-mail.ml', 'trash-mail.tk', 'trashdevil.com', 'trashdevil.de',
  'trashemail.de', 'trashimail.com', 'trashmail.app', 'trashmail.at',
  'trashmail.com', 'trashmail.de', 'trashmail.io', 'trashmail.me',
  'trashmail.net', 'trashmail.org', 'trashmail.xyz', 'trashmailer.com',
  'trashmaill.com', 'trashspam.com', 'trillianpro.com', 'trmailbox.com',
  'turual.com', 'twinmail.de', 'tyldd.com', 'uggsrock.com', 'umail.net',
  'uroid.com', 'us.af', 'venompen.com', 'veryrealemail.com', 'viditag.com',
  'viewcastmedia.com', 'viewcastmedia.net', 'viewcastmedia.org',
  'vomoto.com', 'vpn.st', 'vsimcard.com', 'vubby.com', 'wasteland.rr.nu',
  'webemail.me', 'webm4il.info', 'wegwerfmail.de', 'wegwerfmail.net',
  'wegwerfmail.org', 'wh4f.org', 'whyspam.me', 'willhackforfood.biz',
  'willselfdestruct.com', 'winemaven.info', 'wronghead.com', 'wuzupmail.net',
  'www.e4ward.com', 'www.gishpuppy.com', 'www.mailinator.com',
  'wwwnew.eu', 'xagloo.com', 'xemaps.com', 'xents.com', 'xmaily.com',
  'xoxy.net', 'xyzfree.net', 'yapped.net', 'yeah.net', 'yep.it',
  'yogamaven.com', 'yopmail.fr', 'yopmail.pp.ua', 'yourdomain.com',
  'ypmail.webarnak.fr.eu.org', 'yuurok.com', 'z1p.biz', 'za.com',
  'zehnminuten.de', 'zehnminutenmail.de', 'zetmail.com', 'zippymail.info',
  'zoaxe.com', 'zoemail.net', 'zoemail.org', 'zomg.info', 'zxcv.com',
  'zxcvbnm.com', 'zzz.com',
])

/**
 * Returns true if the email uses a real, non-disposable domain.
 * @param {string} email
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEmailDomain(email) {
  if (!validateEmail(email)) return { valid: false, error: 'Enter a valid email address' }
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return { valid: false, error: 'Enter a valid email address' }
  if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
    return { valid: false, error: 'Please use a real email address. Disposable or test emails are not allowed.' }
  }
  // Block obviously fake local parts
  const local = email.split('@')[0].toLowerCase()
  const fakeLocalParts = ['test', 'fake', 'dummy', 'asdf', 'qwerty', 'abc', 'xyz', 'aaa', 'bbb', 'ccc', '123', '1234', '12345']
  if (fakeLocalParts.includes(local)) {
    return { valid: false, error: 'Please use your real email address.' }
  }
  return { valid: true }
}

/**
 * Validates a password — must be at least 8 characters, contain uppercase,
 * lowercase, a digit, and a special character.
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password) {
  const errors = []
  if (password.length < 8) errors.push('At least 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
  if (!/\d/.test(password)) errors.push('One number')
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('One special character')
  return { valid: errors.length === 0, errors }
}

/**
 * Returns a password strength label and color.
 * @param {string} password
 * @returns {{ label: string, color: string, score: number }}
 */
export function getPasswordStrength(password) {
  if (!password) return { label: '', color: '', score: 0 }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++

  if (score <= 2) return { label: 'Weak', color: '#EF4444', score }
  if (score <= 4) return { label: 'Fair', color: '#F59E0B', score }
  if (score <= 5) return { label: 'Good', color: '#3B82F6', score }
  return { label: 'Strong', color: '#22C55E', score }
}

/**
 * Validates an Indian phone number — exactly 10 digits, not obviously fake.
 * @param {string} phone
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePhoneNumber(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 10) return { valid: false, error: 'Phone must be exactly 10 digits' }

  // Must start with 6, 7, 8, or 9 (valid Indian mobile prefixes)
  if (!/^[6-9]/.test(digits)) {
    return { valid: false, error: 'Enter a valid Indian mobile number (must start with 6, 7, 8, or 9)' }
  }

  // Reject all-same digits: 1111111111, 9999999999, etc.
  if (/^(\d)\1{9}$/.test(digits)) {
    return { valid: false, error: 'Enter a real mobile number' }
  }

  // Reject sequential patterns: 1234567890, 9876543210
  const sequential = ['1234567890', '0123456789', '9876543210', '0987654321']
  if (sequential.includes(digits)) {
    return { valid: false, error: 'Enter a real mobile number' }
  }

  // Reject known test numbers
  const testNumbers = ['9999999999', '8888888888', '7777777777', '6666666666',
    '9876543210', '1234567890', '0000000000', '1111111111', '2222222222',
    '3333333333', '4444444444', '5555555555']
  if (testNumbers.includes(digits)) {
    return { valid: false, error: 'Enter a real mobile number' }
  }

  return { valid: true }
}

/**
 * Legacy — kept for backward compat. Use validatePhoneNumber for full validation.
 * @param {string} phone
 * @returns {boolean}
 */
export function validatePhone(phone) {
  return /^\d{10}$/.test(phone)
}

/**
 * Validates an Indian PIN code — exactly 6 numeric digits.
 * @param {string} pinCode
 * @returns {boolean}
 */
export function validatePinCode(pinCode) {
  return /^\d{6}$/.test(pinCode)
}

/**
 * Validates a UPI ID — pattern: localpart@provider
 * @param {string} upiId
 * @returns {boolean}
 */
export function validateUpiId(upiId) {
  return /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(upiId)
}

/**
 * Validates a card expiry in MM/YY format and ensures it is not in the past.
 * @param {string} expiry
 * @returns {boolean}
 */
export function validateCardExpiry(expiry) {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false
  const [mmStr, yyStr] = expiry.split('/')
  const month = parseInt(mmStr, 10)
  const year = parseInt(yyStr, 10) + 2000
  if (month < 1 || month > 12) return false
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (year < currentYear) return false
  if (year === currentYear && month < currentMonth) return false
  return true
}

/**
 * Validates a card number using the Luhn algorithm.
 * @param {string} cardNumber
 * @returns {boolean}
 */
export function validateCardNumber(cardNumber) {
  const digits = cardNumber.replace(/[\s-]/g, '')
  if (!/^\d{13,19}$/.test(digits)) return false
  let sum = 0
  let shouldDouble = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10)
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

/**
 * Validates a full name — at least 2 chars, letters and spaces only.
 * @param {string} name
 * @returns {boolean}
 */
export function validateFullName(name) {
  return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name.trim())
}

/**
 * Generates a 6-digit numeric OTP.
 * @returns {string}
 */
export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}
