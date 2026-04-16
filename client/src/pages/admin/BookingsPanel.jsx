import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { StatusBadge, PageLoader, EmptyState } from '../../components/UI'
import api from '../../utils/api'

export default function BookingsPanel() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/bookings')
      .then(({ data }) => setBookings(data.bookings))
      .finally(() => setLoading(false))
  }, [])

  const filtered = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b => {
      if (!search) return true
      const s = search.toLowerCase()
      return (
        b.bookingId?.toLowerCase().includes(s) ||
        b.customerId?.name?.toLowerCase().includes(s) ||
        b.tripId?.from?.toLowerCase().includes(s) ||
        b.tripId?.to?.toLowerCase().includes(s)
      )
    })

  const tabs = ['all', 'booked', 'picked', 'in-transit', 'delivered', 'cancelled']

  const statusCounts = tabs.reduce((acc, tab) => {
    acc[tab] = tab === 'all' ? bookings.length : bookings.filter(b => b.status === tab).length
    return acc
  }, {})

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">All Bookings</h1>
        <p className="page-subtitle">Monitor all parcel deliveries across the platform</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          className="input max-w-xs text-sm"
          placeholder="Search booking ID, customer, route..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
                ${filter === tab ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
              {tab} ({statusCounts[tab]})
            </button>
          ))}
        </div>
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon="📦" title="No bookings found" description="Try adjusting your filters" />
      ) : (
        <div className="table-wrapper animate-fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Driver</th>
                <th>Parcel</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b._id}>
                  <td><span className="font-mono text-xs text-brand-400">{b.bookingId}</span></td>
                  <td>
                    <div>
                      <p className="text-sm font-medium text-white">{b.customerId?.name || '–'}</p>
                      <p className="text-xs text-slate-500">{b.customerId?.phone}</p>
                    </div>
                  </td>
                  <td>
                    {b.tripId ? (
                      <div>
                        <p className="text-xs font-medium text-white">{b.tripId.from} → {b.tripId.to}</p>
                        <p className="text-xs text-slate-500">{new Date(b.tripId.date).toLocaleDateString('en-IN')}</p>
                      </div>
                    ) : <span className="text-slate-600">–</span>}
                  </td>
                  <td className="text-xs">{b.tripId?.driverId?.name || '–'}</td>
                  <td>
                    <div>
                      <p className="text-xs text-white truncate max-w-[120px]">{b.parcelDetails?.description}</p>
                      <p className="text-xs text-slate-500">{b.parcelDetails?.weight}kg</p>
                    </div>
                  </td>
                  <td>
                    <span className="font-semibold text-white">₹{b.amount}</span>
                    <p className="text-xs text-slate-500">{b.paymentStatus}</p>
                  </td>
                  <td><StatusBadge status={b.status} /></td>
                  <td className="text-xs text-slate-500">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
