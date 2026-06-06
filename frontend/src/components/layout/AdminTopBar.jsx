import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/index.js'

const pageTitles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/products/new': 'New Product',
  '/admin/inventory': 'Inventory',
  '/admin/orders': 'Orders',
  '/admin/users': 'Users',
}

export default function AdminTopBar() {
  const { currentUser } = useAuth()
  const { pathname } = useLocation()

  const title = pageTitles[pathname] ?? (pathname.includes('/edit') ? 'Edit Product' : 'Admin')

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="font-semibold text-gray-800">{title}</h1>
      <span className="text-sm text-gray-500">
        👤 {currentUser?.fullName ?? 'Admin'}
      </span>
    </header>
  )
}
