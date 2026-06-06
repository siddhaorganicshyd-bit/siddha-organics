import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/index.js'
import SiddhaLogo from '../ui/SiddhaLogo.jsx'

const navLinks = [
  { to: '/admin/dashboard',    label: 'Dashboard',     icon: '📊', desc: 'Overview & stats' },
  { to: '/admin/products',     label: 'Products',      icon: '📦', desc: 'Manage catalogue' },
  { to: '/admin/inventory',    label: 'Inventory',     icon: '📋', desc: 'Stock levels' },
  { to: '/admin/orders',       label: 'Orders',        icon: '🛒', desc: 'Customer orders' },
  { to: '/admin/transactions', label: 'Transactions',  icon: '💳', desc: 'Payment activity' },
  { to: '/admin/users',        label: 'Users',         icon: '👥', desc: 'Manage accounts' },
  { to: '/admin/coupons',      label: 'Coupons',       icon: '🎟️', desc: 'Discount codes' },
  { to: '/admin/settings',     label: 'Settings',      icon: '⚙️', desc: 'Store configuration' },
]

export default function AdminSidebar() {
  const { logout, user } = useAuth()

  return (
    <aside
      className="w-64 shrink-0 flex flex-col min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo / Brand */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/admin/dashboard" className="flex items-center gap-3">
          <SiddhaLogo variant="light" size="md" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Siddha Organics</p>
            <p className="text-slate-400 text-xs">Admin Console</p>
          </div>
        </Link>
      </div>

      {/* Nav section label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Navigation</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {navLinks.map(({ to, label, icon, desc }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-all ${
                    isActive ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/10'
                  }`}
                >
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="leading-tight">{label}</p>
                  <p className={`text-xs leading-tight mt-0.5 ${isActive ? 'text-emerald-400/70' : 'text-slate-500'}`}>
                    {desc}
                  </p>
                </div>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-5 my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* User info + logout */}
      <div className="px-3 pb-5 flex flex-col gap-1">
        {/* Admin badge */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #2D5016, #4A7C2F)' }}
          >
            {user?.fullName?.[0] || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email || ''}</p>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-medium shrink-0">
            Admin
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20 w-full text-left"
        >
          <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-base shrink-0">
            🚪
          </span>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
