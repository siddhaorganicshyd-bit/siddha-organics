// Re-export hooks from each context module
// Each hook throws if used outside its respective provider

export { useAuth } from './AuthContext'
export { useProducts } from './ProductContext'
export { useCart } from './CartContext'
export { useOrders } from './OrderContext'
export { useWishlist } from './WishlistContext'
