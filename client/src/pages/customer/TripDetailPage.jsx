import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { StatusBadge, PageLoader } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

export default function TripDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/customer/trips/${id}`)
      .then(({ data }) => setTrip({ ...data.trip, driverVehicle: data.driverVehicle }))
      .catch(() => navigate('/trips'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <><Navbar /><PageLoader /></>
  if (!trip) return null

  const date = new Date(trip.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const slotsPercent = Math.round(((trip.capacity - trip.availableSlots) / trip.capacity) * 100)

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/trips" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to trips
        </Link>

        <div className="card p-6 mb-4 animate-slide-up">
          {/* Route header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="font-display text-xl font-bold text-white">{trip.from}</p>
                <p className="text-xs text-slate-500">Origin City</p>
                {trip.pickupLocation && <p className="text-xs text-slate-400 mt-1">Pickup: {trip.pickupLocation}</p>}
              </div>
              <div className="flex items-center gap-1 text-brand-500">
                <div className="w-16 h-px bg-brand-500/50" />
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <div className="w-16 h-px bg-brand-500/50" />
              </div>
              <div className="text-center">
                <p className="font-display text-xl font-bold text-white">{trip.to}</p>
                <p className="text-xs text-slate-500">Destination City</p>
                {trip.dropLocation && <p className="text-xs text-slate-400 mt-1">Drop: {trip.dropLocation}</p>}
              </div>
            </div>
            <StatusBadge status={trip.status} />
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: 'Date', value: date },
              { label: 'Departure Time', value: trip.time },
              { label: 'Arrival Time', value: trip.arrivalTime || '-' },
              { label: 'Total Capacity', value: `${trip.capacity} kg` },
              { label: 'Available Capacity', value: `${trip.availableSlots} kg` },
              { label: 'Pickup Location', value: trip.pickupLocation || '—' },
              { label: 'Drop Location', value: trip.dropLocation || '—' },
              { label: 'Price per Kg', value: `₹${trip.pricePerKg ?? trip.pricePerSlot}/kg` },
              { label: 'Payment', value: 'Cash on Delivery' },
            ].map(item => (
              <div key={item.label} className="bg-slate-800/40 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Capacity bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Capacity Used</span>
              <span>{slotsPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-brand-500 h-2 rounded-full transition-all"
                style={{ width: `${slotsPercent}%` }}
              />
            </div>
          </div>

          {/* Driver info */}
          {trip.driverId && (
            <div className="border-t border-slate-800 pt-5 mb-5">
              <p className="label mb-3">Driver Information</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center">
                  <span className="font-bold text-brand-400 text-sm">{trip.driverId.name?.[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{trip.driverId.name}</p>
                  <p className="text-xs text-slate-400">{trip.driverId.phone}</p>
                </div>
              </div>

              {trip.driverVehicle && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/40 rounded-xl p-3">
                    <p className="text-slate-500 mb-1">Vehicle Type</p>
                    <p className="text-slate-200 font-semibold capitalize">{trip.driverVehicle.vehicleType}</p>
                    {trip.driverVehicle.vehicleTypeDescription && (
                      <p className="text-slate-400 mt-1">{trip.driverVehicle.vehicleTypeDescription}</p>
                    )}
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3">
                    <p className="text-slate-500 mb-1">Vehicle Number</p>
                    <p className="text-slate-200 font-semibold">{trip.driverVehicle.vehicleNumber || '—'}</p>
                    {(trip.driverVehicle.vehicleName || trip.driverVehicle.vehicleColor) && (
                      <p className="text-slate-400 mt-1">
                        {[trip.driverVehicle.vehicleName, trip.driverVehicle.vehicleColor].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {trip.notes && (
            <div className="bg-slate-800/40 rounded-xl p-3 mb-5">
              <p className="text-xs text-slate-500 mb-1">Driver Notes</p>
              <p className="text-sm text-slate-300">{trip.notes}</p>
            </div>
          )}

          {/* Book button */}
          {trip.status === 'approved' && trip.availableSlots > 0 ? (
            user ? (
              user.role === 'customer' ? (
                <button
                  onClick={() => navigate(`/book/${trip._id}`)}
                  className="btn-primary w-full py-3 text-base"
                >
                  Book Parcel →
                </button>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-300 text-center">
                  Only customers can book parcels
                </div>
              )
            ) : (
              <Link to="/login" className="btn-primary w-full py-3 text-base text-center block">
                Login to Book →
              </Link>
            )
          ) : (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-slate-400 text-center">
              {trip.availableSlots <= 0 ? 'No capacity available' : 'Trip not available for booking'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
