import { useState, useEffect } from 'react'
import DriverLayout from '../../components/DriverLayout'
import { StatusBadge, PageLoader, EmptyState, Spinner } from '../../components/UI'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const STATUS_FLOW = {
  booked: ['picked'],
  picked: ['in-transit'],
  'in-transit': ['delivered'],
}

export default function DriverBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [filter, setFilter] = useState('all')

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/driver/bookings')
      setBookings(data.bookings)
    } catch { toast.error('Failed to load bookings') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchBookings() }, [])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try {
      await api.put(`/driver/booking/${id}/status`, { status })
      toast.success(`Marked as ${status}`)
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)
  const tabs = ['all', 'booked', 'picked', 'in-transit', 'delivered', 'cancelled']

  return (
    <DriverLayout>
      <div className="page-header">
        <h1 className="page-title">Parcel Bookings</h1>
        <p className="page-subtitle">Manage parcels assigned to your trips</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors
              ${filter === tab ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon="📦" title="No bookings" description="Bookings on your approved trips will appear here" />
      ) : (
        <div className="space-y-4 animate-fade-in">
          {filtered.map(b => {
            const nextStatuses = STATUS_FLOW[b.status] || []
            return (
              <div key={b._id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-brand-400">{b.bookingId}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    {b.tripId && (
                      <p className="text-sm text-slate-300">
                        {b.tripId.from} → {b.tripId.to} · {new Date(b.tripId.date).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">₹{b.amount}</p>
                    <p className="text-xs text-slate-500">Cash on delivery</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/40 rounded-xl p-3 mb-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Parcel</p>
                    <p className="text-white font-medium truncate">{b.parcelDetails?.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Weight</p>
                    <p className="text-white font-medium">{b.parcelDetails?.weight}kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Receiver</p>
                    <p className="text-white font-medium truncate">{b.parcelDetails?.receiverName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                    <p className="text-white font-medium">{b.parcelDetails?.receiverPhone}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400 truncate mr-4">
                    📍 {b.parcelDetails?.deliveryAddress}
                  </div>
                  {nextStatuses.length > 0 && (
                    <div className="flex gap-2 flex-shrink-0">
                      {nextStatuses.map(ns => (
                        <button
                          key={ns}
                          onClick={() => updateStatus(b._id, ns)}
                          disabled={updating === b._id}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          {updating === b._id && <Spinner size="sm" />}
                          Mark as {ns}
                        </button>
                      ))}
                    </div>
                  )}
                  {b.status === 'delivered' && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Delivered · Cash collected
                    </span>
                  )}
                </div>

                {b.customerId && (
                  <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
                    Customer: <span className="text-slate-300">{b.customerId.name}</span> · {b.customerId.phone}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DriverLayout>
  )
}
