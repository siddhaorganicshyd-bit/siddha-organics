/** @type {{ taxRate: number, shippingCost: number, freeShippingThreshold: number, lowStockThreshold: number }} */
export const seedSettings = {
  taxRate: 0.18,               // 18% GST
  shippingCost: 5000,          // ₹50 in paise
  freeShippingThreshold: 50000, // ₹500 in paise
  lowStockThreshold: 10,
}
