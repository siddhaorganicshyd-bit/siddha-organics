import React from 'react'
import { Link } from 'react-router-dom'
import SiddhaLogo from '../ui/SiddhaLogo.jsx'

export default function Footer() {
  return (
    <footer className="bg-green text-cream mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-3">
              <SiddhaLogo variant="light" size="md" />
            </div>
            <p className="text-sm text-cream/80 leading-relaxed">
              Pure Goodness, Organic. Bringing nature's finest products straight to your table.
            </p>
          </div>

          {/* Nav links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-cream/70">Shop</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link to="/shop" className="hover:text-cream/80 transition-colors">All Products</Link></li>
              <li><Link to="/shop?category=Honey" className="hover:text-cream/80 transition-colors">Honey</Link></li>
              <li><Link to="/shop?category=Ghee" className="hover:text-cream/80 transition-colors">Ghee</Link></li>
              <li><Link to="/shop?category=Sweeteners" className="hover:text-cream/80 transition-colors">Sweeteners</Link></li>
            </ul>
          </div>

          {/* Account links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-cream/70">Account</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link to="/login" className="hover:text-cream/80 transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-cream/80 transition-colors">Register</Link></li>
              <li><Link to="/account/orders" className="hover:text-cream/80 transition-colors">My Orders</Link></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-cream/70">Company</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link to="/about" className="hover:text-cream/80 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-cream/80 transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-cream/80 transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/20 mt-8 pt-6 text-center text-xs text-cream/60">
          © {new Date().getFullYear()} Siddha Organics. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
