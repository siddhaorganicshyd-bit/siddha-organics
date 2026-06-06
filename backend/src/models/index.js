/**
 * Central export for all Mongoose models.
 * Import from here instead of individual files:
 *   import { User, Product, Order, Settings, OtpRecord, Wishlist, Review, Coupon } from '../models/index.js'
 */

export { default as User }      from './User.js'
export { default as Product }   from './Product.js'
export { default as Order }     from './Order.js'
export { default as Settings }  from './Settings.js'
export { default as OtpRecord } from './OtpRecord.js'
export { default as Wishlist }  from './Wishlist.js'
export { default as Review }    from './Review.js'
export { default as Coupon }    from './Coupon.js'
