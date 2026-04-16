import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { StatCard, PageLoader } from '../../components/UI'
import api from '../../utils/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.stats))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AdminLayout><PageLoader /></AdminLayout>

  const cards = [
    { label: 'Total Drivers', value: stats.drivers.total, sub: `${stats.drivers.approved} verified`, color: 'blue' },
    { label: 'Pending KYC', value: stats.drivers.pending, sub: 'Awaiting review', color: 'amber' },
    { label: 'Total Customers', value: stats.customers.total, sub: 'Registered users', color: 'purple' },
    { label: 'Total Trips', value: stats.trips.total, sub: `${stats.trips.pending} pending approval`, color: 'brand' },
    { label: 'Active Trips', value: stats.trips.approved, sub: 'Approved & live', color: 'green' },
    { label: 'Total Bookings', value: stats.bookings.total, sub: `${stats.bookings.delivered} delivered`, color: 'brand' },
    { label: 'Revenue (COD)', value: `₹${stats.revenue}`, sub: 'Total cash collected', color: 'green' },
    { label: 'Pending Trips', value: stats.trips.pending, sub: 'Need your approval', color: 'amber' },
  ]

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and operations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Quick action panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { to: '/admin/drivers?status=pending', label: 'Pending KYC', count: stats.drivers.pending, icon: '🪪', color: 'amber', desc: 'Drivers awaiting verification' },
          { to: '/admin/trips?status=pending', label: 'Pending Trips', count: stats.trips.pending, icon: '🚦', color: 'blue', desc: 'Trips awaiting approval' },
          { to: '/admin/bookings', label: 'All Bookings', count: stats.bookings.total, icon: '📦', color: 'purple', desc: 'Monitor all deliveries' },
          { to: '/admin/customers', label: 'Customers', count: stats.customers.total, icon: '👥', color: 'green', desc: 'Manage customer accounts' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{item.icon}</span>
              <span className={`font-display text-2xl font-bold ${
                item.color === 'amber' ? 'text-amber-400' :
                item.color === 'blue' ? 'text-blue-400' :
                item.color === 'purple' ? 'text-purple-400' : 'text-green-400'
              }`}>{item.count}</span>
            </div>
            <p className="font-semibold text-white text-sm">{item.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* System health */}
      <div className="card p-5">
        <h2 className="font-display text-base font-bold text-white mb-4">Platform Health</h2>
        <div className="space-y-3">
          {[
            { label: 'Driver Verification Rate', value: stats.drivers.total ? Math.round((stats.drivers.approved / stats.drivers.total) * 100) : 0, color: 'bg-green-500' },
            { label: 'Trip Approval Rate', value: stats.trips.total ? Math.round((stats.trips.approved / stats.trips.total) * 100) : 0, color: 'bg-blue-500' },
            { label: 'Delivery Success Rate', value: stats.bookings.total ? Math.round((stats.bookings.delivered / stats.bookings.total) * 100) : 0, color: 'bg-brand-500' },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{item.label}</span>
                <span className="font-semibold text-white">{item.value}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className={`${item.color} h-1.5 rounded-full transition-all`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
