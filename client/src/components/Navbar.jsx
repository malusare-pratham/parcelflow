import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const next = `${location.pathname}${location.search || ''}`

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="font-display text-lg font-bold text-white">ParcelFlow</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <Link to="/trips" className="btn-ghost text-sm">Browse Trips</Link>
                <Link to={`/login?next=${encodeURIComponent(next)}`} className="btn-ghost text-sm">Login</Link>
                <Link to={`/register?next=${encodeURIComponent(next)}`} className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            ) : user.role === 'customer' ? (
              <>
                <Link to="/trips" className="btn-ghost text-sm">Find Trips</Link>
                <Link to="/my-bookings" className="btn-ghost text-sm">My Bookings</Link>
              </>
            ) : user.role === 'driver' ? (
              <>
                <Link to="/driver" className="btn-ghost text-sm">Dashboard</Link>
                <Link to="/driver/trips" className="btn-ghost text-sm">My Trips</Link>
              </>
            ) : (
              <>
                <Link to="/admin" className="btn-ghost text-sm">Dashboard</Link>
                <Link to="/admin/drivers" className="btn-ghost text-sm">Drivers</Link>
              </>
            )}
          </div>

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-2 transition-colors"
              >
                <div className="w-6 h-6 bg-brand-500/20 border border-brand-500/30 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-brand-400">{user.name[0].toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-slate-300 hidden sm:block">{user.name.split(' ')[0]}</span>
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 card shadow-xl shadow-black/50 py-1 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <span className={`badge mt-1 ${user.role === 'admin' ? 'badge-approved' : user.role === 'driver' ? 'badge-booked' : 'badge-pending'}`}>
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
