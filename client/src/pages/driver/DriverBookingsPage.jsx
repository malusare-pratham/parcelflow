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

  const statusLabel = (status) =>
    String(status)
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/driver/bookings')
      setBookings(data.bookings)
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const decide = async (id, decision) => {
    setUpdating(id)
    try {
      await api.put(`/driver/booking/${id}/decision`, { decision })
      toast.success(decision === 'confirmed' ? 'Booking confirmed' : 'Booking rejected')
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setUpdating(null)
    }
  }

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

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)
  const tabs = ['all', 'booked', 'picked', 'in-transit', 'delivered', 'cancelled']

  return (
    <DriverLayout>
      <div className="page-header">
        <h1 className="page-title">Parcel Bookings</h1>
        <p className="page-subtitle">Manage parcels assigned to your trips</p>
      </div>

      {bookings.some((b) => (b.confirmationStatus ?? 'pending') === 'pending' && b.status !== 'cancelled') && (
        <div className="card p-4 mb-6 border border-amber-500/20 bg-amber-500/5">
          <p className="text-sm font-semibold text-white">Pending Requests</p>
          <p className="text-xs text-slate-400 mt-1">These bookings are waiting for your confirmation.</p>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors
              ${filter === tab ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon="📦" title="No bookings" description="Bookings on your approved trips will appear here" />
      ) : (
        <div className="space-y-4 animate-fade-in">
          {filtered.map((b) => {
            const nextStatuses = STATUS_FLOW[b.status] || []
            const confirmationStatus = b.confirmationStatus ?? 'pending'
            const isPendingRequest = confirmationStatus === 'pending' && b.status !== 'cancelled'

            return (
              <div key={b._id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-bold text-brand-400">{b.bookingId}</span>
                      <StatusBadge status={isPendingRequest ? 'pending' : b.status} />

                      {confirmationStatus === 'confirmed' && b.status !== 'cancelled' && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                          confirmed
                        </span>
                      )}

                      {confirmationStatus === 'rejected' && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300">
                          rejected
                        </span>
                      )}
                    </div>

                    {b.tripId && (
                      <p className="text-sm text-slate-200 font-semibold truncate">
                        {b.tripId.from} → {b.tripId.to} · {new Date(b.tripId.date).toLocaleDateString('en-IN')}
                      </p>
                    )}

                    {b.tripId && (b.tripId.pickupLocation || b.tripId.dropLocation) && (
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-500">Pickup:</span>{' '}
                        <span className="text-slate-400">{b.tripId.pickupLocation || '—'}</span>
                        <span className="text-slate-700"> • </span>
                        <span className="font-semibold text-slate-500">Drop:</span>{' '}
                        <span className="text-slate-400">{b.tripId.dropLocation || '—'}</span>
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right flex-shrink-0">
                    <p className="text-xl font-bold text-white leading-none">₹{b.amount}</p>
                    <p className="text-xs text-slate-500 mt-1">Cash on delivery</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/40 rounded-xl p-4 mb-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Parcel</p>
                    <p className="text-white font-semibold truncate">{b.parcelDetails?.description || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Weight</p>
                    <p className="text-white font-semibold">
                      {b.parcelDetails?.weight ?? '—'}
                      {b.parcelDetails?.weight ? 'kg' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Receiver</p>
                    <p className="text-white font-semibold truncate">{b.parcelDetails?.receiverName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Phone</p>
                    <p className="text-white font-semibold">{b.parcelDetails?.receiverPhone || '—'}</p>
                  </div>
                </div>

                <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-3 mb-4">
                  <p className="text-xs text-slate-500 mb-1">Delivery Address</p>
                  <p className="text-xs text-slate-300 break-words">📍 {b.parcelDetails?.deliveryAddress || '—'}</p>
                </div>

                {Array.isArray(b.parcelImages) && b.parcelImages.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500">Parcel Images</p>
                      <p className="text-[11px] text-slate-600">
                        {b.parcelImages.length} file{b.parcelImages.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {b.parcelImages.slice(0, 5).map((src, idx) => (
                        <a
                          key={`${src}-${idx}`}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                          title="Open image"
                        >
                          <img
                            src={src}
                            alt="Parcel"
                            className="w-full aspect-square object-cover rounded-lg border border-slate-700 hover:border-brand-500/40 transition-colors"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400 truncate mr-4">
                    Customer: <span className="text-slate-200 font-semibold">{b.customerId?.name || '—'}</span> ·{' '}
                    <span className="text-slate-300">{b.customerId?.phone || '—'}</span>
                  </div>

                  {isPendingRequest && (
                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto flex-shrink-0">
                      <button
                        onClick={() => decide(b._id, 'confirmed')}
                        disabled={updating === b._id}
                        className="btn-primary text-sm flex items-center justify-center gap-2 w-full min-w-0"
                      >
                        {updating === b._id && <Spinner size="sm" />}
                        Confirm
                      </button>
                      <button
                        onClick={() => decide(b._id, 'rejected')}
                        disabled={updating === b._id}
                        className="btn-danger text-sm flex items-center justify-center gap-2 w-full min-w-0"
                      >
                        {updating === b._id && <Spinner size="sm" />}
                        Reject
                      </button>
                    </div>
                  )}

                  {nextStatuses.length > 0 && (
                    <div className="w-full sm:w-auto flex-shrink-0">
                      {nextStatuses.map((ns) => (
                        <button
                          key={ns}
                          onClick={() => updateStatus(b._id, ns)}
                          disabled={updating === b._id || confirmationStatus !== 'confirmed'}
                          className="btn-primary text-sm flex items-center justify-center gap-2 w-full sm:min-w-[180px]"
                        >
                          {updating === b._id && <Spinner size="sm" />}
                          Mark as {statusLabel(ns)}
                        </button>
                      ))}
                    </div>
                  )}

                  {b.status === 'delivered' && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Delivered · Cash collected
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DriverLayout>
  )
}
