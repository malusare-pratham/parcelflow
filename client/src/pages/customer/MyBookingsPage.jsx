import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import Navbar from '../../components/Navbar'
import { StatusBadge, PageLoader, EmptyState, ConfirmModal } from '../../components/UI'
import { FA, Icons } from '../../components/fa'
import api from '../../utils/api'

const STATUS_ICON = {
  booked: '📋',
  picked: '📦',
  'in-transit': '🚚',
  delivered: '✅',
  cancelled: '❌',
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState({ open: false, id: null })
  const [cancelling, setCancelling] = useState(false)

  const supportPhone = import.meta.env.VITE_SUPPORT_PHONE
    ? String(import.meta.env.VITE_SUPPORT_PHONE).replace(/[^\d+]/g, '')
    : null

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/customer/bookings/my')
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
            action={
              <Link to="/trips" className="btn-primary">
                Browse Trips
              </Link>
            }
          />
        ) : (
          <div className="space-y-4 animate-slide-up">
            {bookings.map((b) => {
              const trip = b.tripId
              const vehicle = b.driverVehicle
              const timeLabel = trip?.time ? (trip.arrivalTime ? `${trip.time} -> ${trip.arrivalTime}` : trip.time) : null
              const date = trip ? new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'
              const isPendingConfirmation = (b.confirmationStatus ?? 'pending') === 'pending' && b.status !== 'cancelled'
              const driverPhone = trip?.driverId?.phone ? String(trip.driverId.phone).replace(/[^\d+]/g, '') : null

              return (
                <div key={b._id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{STATUS_ICON[b.status] || '📋'}</span>
                        <span className="font-mono text-sm font-bold text-brand-400">{b.bookingId}</span>
                      </div>

                      {trip && (
                        <p className="text-base font-semibold text-white truncate">
                          {trip.from} → {trip.to}
                        </p>
                      )}

                      <p className="text-xs text-slate-400 mt-1">
                        {date}
                        {timeLabel ? <span className="text-slate-600"> • </span> : null}
                        {timeLabel}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusBadge status={isPendingConfirmation ? 'pending' : b.status} />
                      {isPendingConfirmation && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          waiting confirmation
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 bg-slate-800/40 border border-slate-800 rounded-2xl p-4">
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Parcel</p>
                      <p className="text-sm font-semibold text-white truncate">{b.parcelDetails?.description || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Weight</p>
                      <p className="text-sm font-semibold text-white">
                        {b.parcelDetails?.weight ? `${b.parcelDetails.weight}kg` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Amount</p>
                      <p className="text-sm font-semibold text-white">₹{b.amount ?? '—'}</p>
                    </div>
                  </div>

                  {(trip?.pickupLocation || trip?.dropLocation) && (
                    <div className="mt-4 text-xs text-slate-400">
                      <span className="text-slate-500 font-semibold">Pickup:</span>{' '}
                      <span className="text-slate-300">{trip.pickupLocation || '—'}</span>
                      <span className="text-slate-700"> • </span>
                      <span className="text-slate-500 font-semibold">Drop:</span>{' '}
                      <span className="text-slate-300">{trip.dropLocation || '—'}</span>
                    </div>
                  )}

                  {vehicle && (
                    <div className="mt-2 text-xs text-slate-400">
                      <span className="text-slate-500 font-semibold">Vehicle:</span>{' '}
                      <span className="capitalize text-slate-300">{vehicle.vehicleType}</span>
                      {vehicle.vehicleName ? <span className="text-slate-600"> · </span> : null}
                      {vehicle.vehicleName ? <span className="text-slate-300">{vehicle.vehicleName}</span> : null}
                      {vehicle.vehicleColor ? <span className="text-slate-600"> · </span> : null}
                      {vehicle.vehicleColor ? <span className="text-slate-300">{vehicle.vehicleColor}</span> : null}
                      {vehicle.vehicleNumber ? <span className="text-slate-600"> · </span> : null}
                      {vehicle.vehicleNumber ? <span className="text-slate-300">{vehicle.vehicleNumber}</span> : null}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Receiver</p>
                      <p className="text-sm text-slate-200 truncate">
                        <span className="font-semibold">{b.parcelDetails?.receiverName || '—'}</span>
                        <span className="text-slate-600"> • </span>
                        <span className="text-slate-300">{b.parcelDetails?.receiverPhone || '—'}</span>
                      </p>
                    </div>

                    <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                      {driverPhone && (
                        <a
                          href={`tel:${driverPhone}`}
                          className="inline-flex items-center gap-2 px-3 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:border-brand-500/40 hover:text-brand-300 transition-colors"
                          title="Call driver"
                          aria-label="Call driver"
                        >
                          <FA icon={Icons.phone} />
                          <span className="text-xs font-semibold">Call</span>
                        </a>
                      )}

                      {supportPhone && (
                        <a
                          href={`tel:${supportPhone}`}
                          className="inline-flex items-center gap-2 px-3 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:border-brand-500/40 hover:text-brand-300 transition-colors"
                          title="Contact support"
                          aria-label="Contact support"
                        >
                          <FA icon={Icons.phone} />
                          <span className="text-xs font-semibold">Contact</span>
                        </a>
                      )}

                      {['booked'].includes(b.status) && (
                        <button
                          onClick={() => setCancelModal({ open: true, id: b._id })}
                          className="btn-danger text-sm px-4 py-2"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
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
