import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import DateInput from '../../components/DateInput'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const today = new Date().toLocaleDateString('en-CA')

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (date) params.set('date', date)
    navigate(`/trips?${params}`)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 pt-8 sm:pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-3 sm:mb-6">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse-slow" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Same-Day Delivery Marketplace</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold text-white leading-[1.05] tracking-tight mb-4">
            <span className="block whitespace-nowrap">Ship Parcels with</span>
            <span className="block text-brand-400">Scheduled Trips</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-12">
            Connect with verified drivers going your route. Fast, reliable, and affordable same-day parcel delivery.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="card max-w-3xl mx-auto p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="label">Origin (City)</label>
                <input
                  className="input"
                  placeholder="e.g. Pune"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Destination (City)</label>
                <input
                  className="input"
                  placeholder="e.g. Mumbai"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Date</label>
                <DateInput value={date} onChange={e => setDate(e.target.value)} min={today} />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-base">
              Search Available Trips →
            </button>
          </form>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-display text-3xl font-bold text-white text-center mb-3">How It Works</h2>
        <p className="text-slate-400 text-center mb-12">Three simple steps to get your parcel delivered</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '01', icon: '🔍', title: 'Search Trips', desc: 'Find drivers going your route on the date you need' },
            { step: '02', icon: '📦', title: 'Book by Weight', desc: 'Reserve capacity (kg) on a verified driver\'s trip' },
            { step: '03', icon: '✅', title: 'Cash on Delivery', desc: 'Pay the driver in cash when parcel is delivered' },
          ].map(item => (
            <div key={item.step} className="card p-6 text-center hover:border-brand-500/30 transition-colors">
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="font-mono text-xs text-brand-500 mb-2">{item.step}</div>
              <h3 className="font-display text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="card p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Cities Covered', value: '50+' },
            { label: 'Verified Drivers', value: '200+' },
            { label: 'Parcels Delivered', value: '10K+' },
            { label: 'Avg. Delivery Time', value: '4hrs' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-display text-3xl font-bold text-brand-400">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA for drivers */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="card p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl font-bold text-white mb-1">Are you a driver?</h3>
            <p className="text-slate-400 text-sm">Monetize your regular routes. Earn extra by carrying parcels.</p>
          </div>
          <Link to="/register" className="btn-primary whitespace-nowrap">Join as Driver →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center">
        <p className="text-slate-500 text-sm">© 2024 ParcelFlow. Same-day delivery marketplace.</p>
      </footer>
    </div>
  )
}
