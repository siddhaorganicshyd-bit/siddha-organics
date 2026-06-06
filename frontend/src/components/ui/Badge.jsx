import React from 'react'

const variantMap = {
  // Order status
  Pending: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  // Stock status
  'in-stock': 'bg-green-100 text-green-800',
  'low-stock': 'bg-amber-100 text-amber-800',
  'out-of-stock': 'bg-red-100 text-red-800',
  // Account status
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  // Default
  default: 'bg-gray-100 text-gray-700',
}

export default function Badge({ variant = 'default', children, className = '' }) {
  const classes = variantMap[variant] ?? variantMap.default
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classes} ${className}`}
    >
      {children}
    </span>
  )
}
