/**
 * @fileoverview Cart service for Siddha Organics Ecommerce.
 * Handles cart CRUD, totals computation, stock validation, and guest cart merging.
 * All data is persisted in localStorage under the key `siddha_cart_{userId}`.
 */

import { getProduct } from './productService.js';

// ─── localStorage helpers ─────────────────────────────────────────────────────

/**
 * Build the localStorage key for a given userId.
 * @param {string} userId
 * @returns {string}
 */
function cartKey(userId) {
  return `siddha_cart_${userId}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load a cart from localStorage.
 * Returns an empty cart if none is found.
 *
 * @param {string} userId
 * @returns {import('../types/index').Cart}
 */
export function getCart(userId) {
  try {
    const raw = localStorage.getItem(cartKey(userId));
    if (!raw) {
      return { userId, items: [], updatedAt: new Date().toISOString() };
    }
    return /** @type {import('../types/index').Cart} */ (JSON.parse(raw));
  } catch {
    return { userId, items: [], updatedAt: new Date().toISOString() };
  }
}

/**
 * Serialize and persist a cart to localStorage.
 *
 * @param {string} userId
 * @param {import('../types/index').Cart} cart
 */
export function saveCart(userId, cart) {
  try {
    localStorage.setItem(cartKey(userId), JSON.stringify(cart));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw err;
    }
  }
}

/**
 * Add an item to the cart.
 * - Checks available stock via productService.
 * - If the item already exists, increments its quantity.
 * - Otherwise creates a new line item with a `priceAtAdd` snapshot.
 * - Saves the updated cart.
 *
 * @param {string} userId
 * @param {string} productId
 * @param {string} variantId
 * @param {number} quantity
 * @returns {import('../types/index').Cart}
 */
export function addItem(userId, productId, variantId, quantity) {
  const cart = getCart(userId);

  // Resolve product and variant for stock + price snapshot
  const product = getProduct(productId);
  const variant = product ? product.variants.find((v) => v.id === variantId) : null;

  const availableStock = variant ? variant.stock : 0;

  const existingIndex = cart.items.findIndex(
    (item) => item.productId === productId && item.variantId === variantId,
  );

  if (existingIndex !== -1) {
    // Increment quantity, capped at available stock
    const currentQty = cart.items[existingIndex].quantity;
    const newQty = Math.min(currentQty + quantity, availableStock);
    cart.items[existingIndex] = {
      ...cart.items[existingIndex],
      quantity: newQty,
    };
  } else {
    // Create new line item
    const priceAtAdd = variant ? variant.price : 0;
    const cappedQty = Math.min(quantity, availableStock);

    if (cappedQty > 0) {
      /** @type {import('../types/index').CartItem} */
      const newItem = {
        productId,
        variantId,
        quantity: cappedQty,
        priceAtAdd,
      };
      cart.items.push(newItem);
    }
  }

  cart.updatedAt = new Date().toISOString();
  saveCart(userId, cart);
  return cart;
}

/**
 * Update the quantity of a specific line item.
 * Removes the item if quantity <= 0.
 *
 * @param {string} userId
 * @param {string} productId
 * @param {string} variantId
 * @param {number} quantity
 * @returns {import('../types/index').Cart}
 */
export function updateQuantity(userId, productId, variantId, quantity) {
  const cart = getCart(userId);

  if (quantity <= 0) {
    cart.items = cart.items.filter(
      (item) => !(item.productId === productId && item.variantId === variantId),
    );
  } else {
    const index = cart.items.findIndex(
      (item) => item.productId === productId && item.variantId === variantId,
    );
    if (index !== -1) {
      cart.items[index] = { ...cart.items[index], quantity };
    }
  }

  cart.updatedAt = new Date().toISOString();
  saveCart(userId, cart);
  return cart;
}

/**
 * Remove a specific line item from the cart.
 *
 * @param {string} userId
 * @param {string} productId
 * @param {string} variantId
 * @returns {import('../types/index').Cart}
 */
export function removeItem(userId, productId, variantId) {
  const cart = getCart(userId);

  cart.items = cart.items.filter(
    (item) => !(item.productId === productId && item.variantId === variantId),
  );

  cart.updatedAt = new Date().toISOString();
  saveCart(userId, cart);
  return cart;
}

/**
 * Empty all items from the cart.
 *
 * @param {string} userId
 * @returns {import('../types/index').Cart}
 */
export function clearCart(userId) {
  const cart = getCart(userId);
  cart.items = [];
  cart.updatedAt = new Date().toISOString();
  saveCart(userId, cart);
  return cart;
}

/**
 * Merge the guest cart (`siddha_cart_guest`) into the user's cart.
 * - If an item already exists in the user cart, its quantity is incremented.
 * - New items are appended.
 * - The guest cart is cleared after merging.
 *
 * @param {string} userId
 * @returns {import('../types/index').Cart}
 */
export function mergeGuestCart(userId) {
  const guestCart = getCart('guest');
  if (guestCart.items.length === 0) return getCart(userId);

  const userCart = getCart(userId);

  for (const guestItem of guestCart.items) {
    const existingIndex = userCart.items.findIndex(
      (item) =>
        item.productId === guestItem.productId &&
        item.variantId === guestItem.variantId,
    );

    if (existingIndex !== -1) {
      userCart.items[existingIndex] = {
        ...userCart.items[existingIndex],
        quantity: userCart.items[existingIndex].quantity + guestItem.quantity,
      };
    } else {
      userCart.items.push({ ...guestItem });
    }
  }

  userCart.updatedAt = new Date().toISOString();
  saveCart(userId, userCart);

  // Clear the guest cart
  clearCart('guest');

  return userCart;
}

/**
 * Compute cart totals from a cart and app settings.
 *
 * - subtotal: sum of (priceAtAdd × quantity) for all items, in paise
 * - tax: subtotal × 0.18, rounded to nearest integer (paise)
 * - shipping: 0 if subtotal >= 50000 paise (₹500), else 5000 paise (₹50)
 * - total: subtotal + tax + shipping
 *
 * @param {import('../types/index').Cart} cart
 * @param {import('../types/index').AppSettings} settings
 * @returns {import('../types/index').CartTotals}
 */
export function computeCartTotals(cart, settings) {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.priceAtAdd * item.quantity,
    0,
  );

  const taxRate = settings?.taxRate ?? 0.18;
  const tax = Math.round(subtotal * taxRate);

  const freeShippingThreshold = settings?.freeShippingThreshold ?? 50000;
  const shippingCost = settings?.shippingCost ?? 5000;
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost;

  const total = subtotal + tax + shipping;

  return { subtotal, tax, shipping, total };
}

/**
 * Validate cart items against current stock levels.
 * Caps each item's quantity to the available stock.
 * Returns the (possibly adjusted) cart and a list of adjustments made.
 *
 * @param {string} userId
 * @param {import('../types/index').Product[]} products
 * @returns {{ cart: import('../types/index').Cart, adjustments: Array<{ productId: string, variantId: string, oldQty: number, newQty: number }> }}
 */
export function validateCartStock(userId, products) {
  const cart = getCart(userId);
  /** @type {Array<{ productId: string, variantId: string, oldQty: number, newQty: number }>} */
  const adjustments = [];

  cart.items = cart.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const variant = product
      ? product.variants.find((v) => v.id === item.variantId)
      : null;

    const availableStock = variant ? variant.stock : 0;

    if (item.quantity > availableStock) {
      adjustments.push({
        productId: item.productId,
        variantId: item.variantId,
        oldQty: item.quantity,
        newQty: availableStock,
      });
      return { ...item, quantity: availableStock };
    }

    return item;
  });

  // Remove items that have been capped to 0
  cart.items = cart.items.filter((item) => item.quantity > 0);

  cart.updatedAt = new Date().toISOString();
  saveCart(userId, cart);

  return { cart, adjustments };
}

/**
 * Returns false if the specified variant has stock === 0, true otherwise.
 *
 * @param {string} productId
 * @param {string} variantId
 * @param {import('../types/index').Product[]} products
 * @returns {boolean}
 */
export function canAddToCart(productId, variantId, products) {
  const product = products.find((p) => p.id === productId);
  if (!product) return false;

  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return false;

  return variant.stock > 0;
}
