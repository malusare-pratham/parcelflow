import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import { StatusBadge, PageLoader, EmptyState, ConfirmModal } from '../../components/UI'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState({ open: false, id: null })
  const [cancelling, setCancelling] = useState(false)

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/customer/bookings/my')
      setBookings(data.bookings)
    } catch (err) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings() }, [])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await api.put(`/customer/bookings/${cancelModal.id}/cancel`)
      toast.success('Booking cancelled')
      setCancelModal({ open: false, id: null })
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed')
    } finally {
      setCancelling(false)
    }
  }

  const statusIcon = {
    booked: '📋',
    picked: '📦',
    'in-transit': '🚛',
    delivered: '✅',
    cancelled: '❌',
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="page-header">
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">Track all your parcel deliveries</p>
        </div>

        {loading ? (
          <PageLoader />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No bookings yet"
            description="Find a trip and book your first parcel delivery"
            action={<Link to="/trips" className="btn-primary">Browse Trips</Link>}
          />
        ) : (
          <div className="space-y-4 animate-slide-up">
            {bookings.map(b => {
              const trip = b.tripId
              const date = trip ? new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '–'
              return (
                <div key={b._id} className="card p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{statusIcon[b.status] || '📋'}</span>
                        <span className="font-mono text-sm font-bold text-brand-400">{b.bookingId}</span>
                      </div>
                      {trip && (
                        <p className="text-sm font-semibold text-white">
                          {trip.from} → {trip.to}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">{date} {trip?.time && `• ${trip.time}`}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-slate-800/40 rounded-xl p-3 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Parcel</p>
                      <p className="text-sm font-medium text-white truncate">{b.parcelDetails.description}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Weight</p>
                      <p className="text-sm font-medium text-white">{b.parcelDetails.weight}kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="text-sm font-medium text-white">₹{b.amount}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Receiver: <span className="text-slate-300">{b.parcelDetails.receiverName}</span> • {b.parcelDetails.receiverPhone}
                    </div>
                    {['booked'].includes(b.status) && (
                      <button
                        onClick={() => setCancelModal({ open: true, id: b._id })}
                        className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {b.status === 'delivered' && (
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-emerald-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Delivered · Payment collected by driver
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={cancelModal.open}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        onConfirm={handleCancel}
        onCancel={() => setCancelModal({ open: false, id: null })}
        loading={cancelling}
        danger
      />
    </div>
  )
}
