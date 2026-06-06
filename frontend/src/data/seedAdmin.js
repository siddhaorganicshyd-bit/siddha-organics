/**
 * Default admin password for development reference only.
 * Never use this in production — replace with a real bcrypt hash.
 */
export const ADMIN_PLAIN_PASSWORD = 'Admin@123'

/** @type {import('./seedAdmin').SeedAdmin} */
export const seedAdmin = {
  id: 'f0e1d2c3-b4a5-6789-0fed-cba987654321',
  fullName: 'Siddha Admin',
  email: 'admin@siddhaorganics.com',
  phone: '9876543210',
  passwordHash: '$2b$12$simulated_QWRtaW5AMTIz',
  role: 'admin',
  status: 'active',
  addresses: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  failedLoginAttempts: 0,
  lockedUntil: null,
}
