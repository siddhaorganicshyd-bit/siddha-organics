/**
 * In-memory data store (replaces localStorage for the backend)
 * In production, replace this with a real database (MongoDB, PostgreSQL, etc.)
 */

import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

// ─── Seed Products ────────────────────────────────────────────────────────────

const seedProducts = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Raw Tulsi Honey',
    slug: 'raw-tulsi-honey',
    category: 'Honey',
    shortDescription: 'Pure, unprocessed honey infused with the healing essence of Tulsi.',
    description: 'Our Raw Tulsi Honey is sourced directly from beekeepers near Tulsi plantations in the Himalayas.',
    ingredients: 'Raw Tulsi Honey (100%). No additives.',
    images: ['https://iili.io/BQC6GPS.jpeg'],
    variants: [
      { id: 'v1-500g', label: '500g', price: 57800, mrp: 68000, discountPercent: 15, stock: 85, lowStockThreshold: 10, sku: 'HONEY-TULSI-500G' },
    ],
    status: 'active',
    isFeatured: true,
    salesCount: 342,
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2024-06-15T10:30:00.000Z',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'A2 Gir Cow Ghee',
    slug: 'a2-gir-cow-ghee',
    category: 'Ghee',
    shortDescription: 'Traditionally churned ghee from indigenous Gir cows.',
    description: 'Crafted using the ancient Vedic Bilona method from fresh Gir cow milk.',
    ingredients: 'A2 Gir Cow Milk (100%). No additives.',
    images: ['https://iili.io/BQCOFm7.jpeg'],
    variants: [
      { id: 'v2-500ml', label: '500ml', price: 135000, mrp: 150000, discountPercent: 10, stock: 60, lowStockThreshold: 10, sku: 'GHEE-GIR-500ML' },
    ],
    status: 'active',
    isFeatured: true,
    salesCount: 518,
    createdAt: '2024-01-12T09:00:00.000Z',
    updatedAt: '2024-06-18T11:00:00.000Z',
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'Sundarban Wild Forest Honey',
    slug: 'sundarban-wild-forest-honey',
    category: 'Honey',
    shortDescription: 'Unfiltered wild honey from the ancient Sundarban mangrove forests.',
    description: 'Harvested by tribal honey hunters from the dense Sundarban mangrove forests.',
    ingredients: 'Raw Wild Forest Honey (100%). No processing.',
    images: ['https://iili.io/BQCr3xV.jpeg'],
    variants: [
      { id: 'v3-500g', label: '500g', price: 43700, mrp: 59900, discountPercent: 27, stock: 100, lowStockThreshold: 10, sku: 'HONEY-SUNDARBAN-500G' },
      { id: 'v3-1kg', label: '1kg', price: 76300, mrp: 109000, discountPercent: 30, stock: 60, lowStockThreshold: 10, sku: 'HONEY-SUNDARBAN-1KG' },
    ],
    status: 'active',
    isFeatured: true,
    salesCount: 275,
    createdAt: '2024-02-05T07:30:00.000Z',
    updatedAt: '2024-06-20T09:45:00.000Z',
  },
  {
    id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    name: 'Jaggery Powder',
    slug: 'jaggery-powder',
    category: 'Sweeteners',
    shortDescription: 'Organic sugarcane jaggery in fine powder form.',
    description: 'Made from freshly pressed sugarcane juice, slowly boiled and ground.',
    ingredients: 'Organic Sugarcane Juice (100%). No sulphur.',
    images: ['https://iili.io/BQCkke2.jpeg'],
    variants: [
      { id: 'v4-1kg', label: '1kg', price: 13500, mrp: 18000, discountPercent: 25, stock: 180, lowStockThreshold: 10, sku: 'SWEET-JAGG-1KG' },
    ],
    status: 'active',
    isFeatured: true,
    salesCount: 189,
    createdAt: '2024-03-01T06:00:00.000Z',
    updatedAt: '2024-06-22T08:00:00.000Z',
  },
]

// ─── Seed Admin ───────────────────────────────────────────────────────────────

const adminPasswordHash = bcrypt.hashSync('Admin@123', 12)

const seedAdmin = {
  id: 'f0e1d2c3-b4a5-6789-0fed-cba987654321',
  fullName: 'Siddha Admin',
  email: 'admin@siddhaorganics.com',
  phone: '9876543210',
  passwordHash: adminPasswordHash,
  role: 'admin',
  status: 'active',
  addresses: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  failedLoginAttempts: 0,
  lockedUntil: null,
}

// ─── In-memory store ──────────────────────────────────────────────────────────

export const db = {
  users: [seedAdmin],
  products: [...seedProducts],
  orders: [],
  settings: {
    taxRate: 0.18,
    shippingCost: 5000,
    freeShippingThreshold: 50000,
    lowStockThreshold: 10,
  },
  auditLog: [],
}
