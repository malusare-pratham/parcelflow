import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DriverLayout from '../../components/DriverLayout'
import { TripCard, PageLoader, EmptyState, ConfirmModal } from '../../components/UI'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function DriverTripsPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('today')
  const [actionModal, setActionModal] = useState({ open: false, trip: null, action: null })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/driver/trips')
      .then(({ data }) => setTrips(data.trips))
      .finally(() => setLoading(false))
  }, [])

  const isToday = (d) => {
    const dt = new Date(d)
    const now = new Date()
    return dt.toDateString() === now.toDateString()
  }

  const filtered =
    filter === 'today'
      ? trips.filter(t => isToday(t.date))
      : filter === 'all'
      ? trips
      : trips.filter(t => t.status === filter)

  const tabs = ['today', 'all', 'pending', 'approved', 'rejected', 'completed']

  const refreshTrips = async () => {
    const { data } = await api.get('/driver/trips')
    setTrips(data.trips)
  }

  const confirmAction = (trip, action) => setActionModal({ open: true, trip, action })

  const handleAction = async () => {
    const { trip, action } = actionModal
    if (!trip || !action) return
    setSubmitting(true)
    try {
      await api.put(`/driver/trips/${trip._id}/status`, { status: action })
      toast.success(action === 'cancelled' ? 'Trip cancelled' : 'Trip marked completed')
      setActionModal({ open: false, trip: null, action: null })
      await refreshTrips()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DriverLayout>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">My Trips</h1>
          <p className="page-subtitle">{trips.length} total trips</p>
        </div>
        <Link to="/driver/create-trip" className="btn-primary text-sm py-2">+ New Trip</Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors
              ${filter === tab ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
          >
            {tab}{' '}
            {tab === 'today'
              ? `(${trips.filter(t => isToday(t.date)).length})`
              : tab === 'all'
              ? `(${trips.length})`
              : `(${trips.filter(t => t.status === tab).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title="No trips found"
          description={filter === 'all' ? "Create your first trip to start earning" : `No ${filter} trips`}
          action={filter === 'all' && <Link to="/driver/create-trip" className="btn-primary">Create Trip</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(trip => (
            <TripCard
              key={trip._id}
              trip={trip}
              action={
                (trip.status === 'pending' || trip.status === 'approved') ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmAction(trip, 'cancelled')}
                      className="btn-danger w-full text-sm py-2"
                    >
                      Cancel Trip
                    </button>
                    {trip.status === 'approved' && (
                      <button
                        onClick={() => confirmAction(trip, 'completed')}
                        className="btn-primary w-full text-sm py-2"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                ) : null
              }
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={actionModal.open}
        title={actionModal.action === 'cancelled' ? 'Cancel Trip' : 'Mark Trip Completed'}
        message={
          actionModal.action === 'cancelled'
            ? 'Cancel this trip? All bookings on this trip will be cancelled automatically.'
            : 'Mark this trip as completed?'
        }
        onCancel={() => setActionModal({ open: false, trip: null, action: null })}
        onConfirm={handleAction}
        loading={submitting}
        danger={actionModal.action === 'cancelled'}
      />
    </DriverLayout>
  )
}
