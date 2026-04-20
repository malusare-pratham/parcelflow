import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { PageLoader, Spinner } from '../../components/UI'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function BookingPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [booked, setBooked] = useState(null)

  const [form, setForm] = useState({
    description: '',
    weight: '',
    receiverName: '',
    receiverPhone: '',
    deliveryAddress: '',
  })

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    api.get(`/customer/trips/${tripId}`)
      .then(({ data }) => setTrip({ ...data.trip, driverVehicle: data.driverVehicle }))
      .catch(() => navigate('/trips'))
      .finally(() => setLoading(false))
  }, [tripId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.weight || Number(form.weight) <= 0) return toast.error('Enter valid parcel weight')
    if (Number(form.weight) > trip.availableSlots) return toast.error(`Max available: ${trip.availableSlots}kg`)
    setSubmitting(true)
    try {
      const { data } = await api.post('/customer/bookings', {
        tripId,
        parcelDetails: { ...form, weight: Number(form.weight) },
      })
      setBooked(data.booking)
      toast.success('Parcel booked successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <><Navbar /><PageLoader /></>

  const pricePerKg = Number(trip?.pricePerKg ?? trip?.pricePerSlot ?? 0)
  const enteredWeight = Number(form.weight)
  const estimatedTotal =
    Number.isFinite(pricePerKg) && enteredWeight > 0
      ? Number((enteredWeight * pricePerKg).toFixed(2))
      : null

  // Success screen
  if (booked) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center animate-slide-up">
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-slate-400 mb-6">Your parcel has been booked on this trip.</p>

          <div className="card p-5 mb-6 text-left">
            <p className="text-xs text-slate-500 mb-1">Booking ID</p>
            <p className="font-mono text-xl font-bold text-brand-400 mb-4">{booked.bookingId}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Amount</p>
                <p className="font-semibold text-white">₹{booked.amount}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Payment</p>
                <p className="font-semibold text-white">Cash on Delivery</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link to="/my-bookings" className="btn-primary flex-1">View My Bookings</Link>
            <Link to="/trips" className="btn-secondary flex-1">Browse More</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link to={`/trips/${tripId}`} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to trip
        </Link>

        {trip && (
          <>
            <div className="card p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white text-sm">{trip.from} → {trip.to}</p>
              <p className="text-xs text-slate-400 mt-0.5">{new Date(trip.date).toLocaleDateString('en-IN')} • {trip.arrivalTime ? `${trip.time} -> ${trip.arrivalTime}` : trip.time}</p>
            </div>
            <div className="text-right">
              <p className="text-brand-400 font-bold">₹{pricePerKg}/kg</p>
              <p className="text-xs text-slate-500">per kg</p>
            </div>
            </div>

            {(trip.pickupLocation || trip.dropLocation) && (
              <div className="text-xs text-slate-400 mb-6">
                <span className="text-slate-500 font-semibold">Pickup:</span> {trip.pickupLocation || '—'}
                <span className="text-slate-600"> • </span>
                <span className="text-slate-500 font-semibold">Drop:</span> {trip.dropLocation || '—'}
              </div>
            )}

            {trip.driverVehicle && (
              <div className="text-xs text-slate-400 mb-6">
                <span className="text-slate-500 font-semibold">Vehicle:</span>{' '}
                <span className="capitalize">{trip.driverVehicle.vehicleType}</span>
                {trip.driverVehicle.vehicleName ? ` · ${trip.driverVehicle.vehicleName}` : ''}
                {trip.driverVehicle.vehicleColor ? ` · ${trip.driverVehicle.vehicleColor}` : ''}
                {trip.driverVehicle.vehicleNumber ? ` · ${trip.driverVehicle.vehicleNumber}` : ''}
                {trip.driverVehicle.vehicleTypeDescription && (
                  <span className="block text-slate-500 mt-1">{trip.driverVehicle.vehicleTypeDescription}</span>
                )}
              </div>
            )}
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
          {/* Parcel info */}
          <div className="form-section">
            <h3 className="font-display text-lg font-bold text-white mb-4">Parcel Details</h3>
            <div>
              <label className="label">Description</label>
              <input className="input" placeholder="e.g. Electronics, clothes, documents" value={form.description} onChange={set('description')} required />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step="0.1" min="0.1" max={trip?.availableSlots}
                className="input" placeholder={`Max ${trip?.availableSlots}kg`}
                value={form.weight} onChange={set('weight')} required />
              <p className="text-xs text-slate-500 mt-1">Available capacity: {trip?.availableSlots}kg</p>
            </div>
          </div>

          {/* Receiver info */}
          <div className="form-section">
            <h3 className="font-display text-lg font-bold text-white mb-4">Receiver Information</h3>
            <div>
              <label className="label">Receiver Name</label>
              <input className="input" placeholder="Full name" value={form.receiverName} onChange={set('receiverName')} required />
            </div>
            <div>
              <label className="label">Receiver Phone</label>
              <input type="tel" className="input" placeholder="Mobile number" value={form.receiverPhone} onChange={set('receiverPhone')} required />
            </div>
            <div>
              <label className="label">Delivery Address</label>
              <textarea className="input resize-none" rows={3} placeholder="Full delivery address" value={form.deliveryAddress} onChange={set('deliveryAddress')} required />
            </div>
          </div>

          {/* Payment info */}
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💵</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Cash on Delivery</p>
              <p className="text-xs text-slate-400">
                Pay ₹{estimatedTotal ?? '—'} to the driver upon delivery (₹{pricePerKg}/kg)
              </p>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
            {submitting && <Spinner size="sm" />}
            {submitting ? 'Confirming...' : estimatedTotal ? `Confirm Booking · ₹${estimatedTotal}` : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}
