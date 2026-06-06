import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/index.js'
import { useCart } from '../../contexts/index.js'
import { useWishlist } from '../../contexts/index.js'
import SiddhaLogo from '../ui/SiddhaLogo.jsx'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
]

export default function Navbar() {
  const { isAuthenticated, isAdmin, logout } = useAuth()
  const { itemCount } = useCart()
  const { wishlistIds } = useWishlist()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-cream border-b border-cream-dark shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Nav links together on the left */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="flex items-center shrink-0">
              <SiddhaLogo variant="dark" size="md" />
            </Link>

            {/* Desktop nav links — right next to logo */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors pb-0.5 ${
                      isActive
                        ? 'text-green border-b-2 border-brown'
                        : 'text-green hover:text-green-light'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right side: search + cart + account */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="text-sm border border-gray-300 rounded-l-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green w-40"
              />
              <button
                type="submit"
                className="bg-green text-cream px-3 py-1.5 rounded-r-lg text-sm hover:bg-green-dark transition-colors"
                aria-label="Search"
              >
                🔍
              </button>
            </form>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link to="/wishlist" className="relative p-2 text-green hover:text-green-light" aria-label="Wishlist">
                <span className="text-xl">🤍</span>
                {wishlistIds.size > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green text-cream text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistIds.size > 99 ? '99+' : wishlistIds.size}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-green hover:text-green-light" aria-label="Cart">
              <span className="text-xl">🛒</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green text-cream text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Account */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                {isAdmin ? (
                  <Link to="/admin/dashboard" className="text-sm font-medium text-green hover:text-green-light">
                    Admin
                  </Link>
                ) : (
                  <Link to="/account/profile" className="text-sm font-medium text-green hover:text-green-light">
                    Account
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-sm font-medium text-brown hover:text-brown-dark"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden md:block text-sm font-medium text-green hover:text-green-light">
                Login
              </Link>
            )}

            {/* Hamburger */}
            <button
              className="md:hidden p-2 text-green"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="w-72 bg-cream h-full shadow-xl flex flex-col p-6 gap-4">
            <div className="flex items-center justify-between mb-2">
              <SiddhaLogo variant="dark" size="sm" />
              <button onClick={() => setDrawerOpen(false)} className="text-gray-500 text-xl">×</button>
            </div>
            <form onSubmit={(e) => { handleSearch(e); setDrawerOpen(false) }} className="flex">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 text-sm border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none"
              />
              <button type="submit" className="bg-green text-cream px-3 rounded-r-lg text-sm">🔍</button>
            </form>
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setDrawerOpen(false)} className="text-green font-medium py-2 border-b border-cream-dark">
                {label}
              </Link>
            ))}
            <Link to="/about" onClick={() => setDrawerOpen(false)} className="text-green font-medium py-2 border-b border-cream-dark">
              About
            </Link>
            <Link to="/contact" onClick={() => setDrawerOpen(false)} className="text-green font-medium py-2 border-b border-cream-dark">
              Contact
            </Link>
            {isAuthenticated ? (
              <>
                <Link to={isAdmin ? '/admin/dashboard' : '/account/profile'} onClick={() => setDrawerOpen(false)} className="text-green font-medium py-2 border-b border-cream-dark">
                  {isAdmin ? 'Admin Panel' : 'My Account'}
                </Link>
                <button onClick={() => { logout(); setDrawerOpen(false) }} className="text-brown font-medium py-2 text-left">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setDrawerOpen(false)} className="text-green font-medium py-2">
                Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
