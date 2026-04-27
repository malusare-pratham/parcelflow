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
  const [acceptedRules, setAcceptedRules] = useState(false)
  const [parcelImages, setParcelImages] = useState([])
  const [parcelPreviewUrls, setParcelPreviewUrls] = useState([])

  const [form, setForm] = useState({
    description: '',
    weight: '',
    receiverName: '',
    receiverPhone: '',
    deliveryAddress: '',
  })

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    api
      .get(`/customer/trips/${tripId}`)
      .then(({ data }) => setTrip({ ...data.trip, driverVehicle: data.driverVehicle }))
      .catch(() => navigate('/trips'))
      .finally(() => setLoading(false))
  }, [tripId])

  useEffect(() => {
    const urls = parcelImages.map((f) => URL.createObjectURL(f))
    setParcelPreviewUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [parcelImages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!acceptedRules) return toast.error('Please accept the customer instructions and disclaimer to continue.')
    if (!form.weight || Number(form.weight) <= 0) return toast.error('Enter valid parcel weight')
    if (Number(form.weight) > trip.availableSlots) return toast.error(`Max available: ${trip.availableSlots}kg`)
    if (parcelImages.length < 2) return toast.error('Please upload at least 2 parcel images')

    setSubmitting(true)
    try {
      const details = { ...form, weight: Number(form.weight) }

      // Booking requires images now; always submit multipart.
      const payload = new FormData()
      payload.append('tripId', tripId)
      payload.append('parcelDetails', JSON.stringify(details))
      parcelImages.forEach((f) => payload.append('parcelImages', f))

      const resp = await api.post('/customer/bookings', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const data = resp.data
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
    const isPending = booked.confirmationStatus !== 'confirmed' && booked.status !== 'cancelled'
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center animate-slide-up">
          <div
            className={`w-20 h-20 ${isPending ? 'bg-amber-500/10 border-amber-500/20' : 'bg-green-500/10 border-green-500/20'} border rounded-3xl flex items-center justify-center mx-auto mb-6`}
          >
            {isPending ? (
              <span className="text-3xl">⏳</span>
            ) : (
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-2">
            {isPending ? 'Request Sent!' : 'Booking Confirmed!'}
          </h2>
          <p className="text-slate-400 mb-6">
            {isPending ? 'Request sent to driver. Please wait for confirmation.' : 'Your parcel has been booked on this trip.'}
          </p>

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
            {isPending && (
              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-amber-300">
                Status: Pending driver confirmation
              </div>
            )}
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
        <Link
          to={`/trips/${tripId}`}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to trip
        </Link>

        {trip && (
          <>
            <div className="card p-4 mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm">{trip.from} → {trip.to}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(trip.date).toLocaleDateString('en-IN')} • {trip.arrivalTime ? `${trip.time} -> ${trip.arrivalTime}` : trip.time}
                </p>
              </div>
              <div className="text-right">
                <p className="text-brand-400 font-bold">₹{pricePerKg}/kg</p>
                <p className="text-xs text-slate-500">per kg</p>
              </div>
            </div>

            {(trip.pickupLocation || trip.dropLocation) && (
              <div className="card p-4 mb-4">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Route Details</p>
                <div className="text-sm text-slate-200">
                  <span className="text-slate-500 font-semibold">Pickup:</span>{' '}
                  <span className="text-slate-300">{trip.pickupLocation || '—'}</span>
                </div>
                <div className="text-sm text-slate-200 mt-1">
                  <span className="text-slate-500 font-semibold">Drop:</span>{' '}
                  <span className="text-slate-300">{trip.dropLocation || '—'}</span>
                </div>
              </div>
            )}

            {trip.driverVehicle && (
              <div className="card p-4 mb-6">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Vehicle</p>
                <p className="text-sm text-slate-200">
                  <span className="capitalize text-slate-300">{trip.driverVehicle.vehicleType}</span>
                  {trip.driverVehicle.vehicleName ? <span className="text-slate-600"> · </span> : null}
                  {trip.driverVehicle.vehicleName ? <span className="text-slate-300">{trip.driverVehicle.vehicleName}</span> : null}
                  {trip.driverVehicle.vehicleColor ? <span className="text-slate-600"> · </span> : null}
                  {trip.driverVehicle.vehicleColor ? <span className="text-slate-300">{trip.driverVehicle.vehicleColor}</span> : null}
                  {trip.driverVehicle.vehicleNumber ? <span className="text-slate-600"> · </span> : null}
                  {trip.driverVehicle.vehicleNumber ? <span className="text-slate-300">{trip.driverVehicle.vehicleNumber}</span> : null}
                </p>
                {trip.driverVehicle.vehicleTypeDescription && (
                  <div className="mt-3 bg-slate-800/40 border border-slate-700 rounded-xl p-3 text-xs text-slate-300">
                    {trip.driverVehicle.vehicleTypeDescription}
                  </div>
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
              <input
                className="input"
                placeholder="e.g. Electronics, clothes, documents"
                value={form.description}
                onChange={set('description')}
                required
              />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max={trip?.availableSlots}
                className="input"
                placeholder={`Max ${trip?.availableSlots}kg`}
                value={form.weight}
                onChange={set('weight')}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Available capacity: {trip?.availableSlots}kg</p>
            </div>
            <div>
              <label className="label">Parcel Images (Min 2)</label>

              <div
                className="card p-4 border-dashed border border-slate-700 hover:border-brand-500/40 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const files = Array.from(e.dataTransfer.files || []).filter((f) => String(f.type || '').startsWith('image/'))
                  if (files.length === 0) return
                  const merged = [...parcelImages, ...files].slice(0, 5)
                  if (merged.length > 5) toast.error('You can upload up to 5 images')
                  setParcelImages(merged)
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800/60 border border-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12v9m0-9l-3 3m3-3l3 3M12 3v9" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Upload images or take photos</p>
                    <p className="text-xs text-slate-500">Drag & drop here, or use buttons. Max 5 images, 5MB each.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <label className="btn-secondary text-center cursor-pointer">
                    Upload Photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        const merged = [...parcelImages, ...files].slice(0, 5)
                        if (merged.length > 5) toast.error('You can upload up to 5 images')
                        setParcelImages(merged)
                        e.target.value = ''
                      }}
                    />
                  </label>

                  <label className="btn-primary text-center cursor-pointer">
                    Take Photo
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        const merged = [...parcelImages, ...files].slice(0, 5)
                        if (merged.length > 5) toast.error('You can upload up to 5 images')
                        setParcelImages(merged)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>

                {parcelImages.length > 0 && (
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {parcelImages.length} image{parcelImages.length !== 1 ? 's' : ''} selected (min 2)
                    </span>
                    <button
                      type="button"
                      className="underline underline-offset-2 hover:text-white"
                      onClick={() => setParcelImages([])}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {parcelImages.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {parcelPreviewUrls.map((url, idx) => (
                    <div key={url} className="relative">
                      <img
                        src={url}
                        alt="Parcel preview"
                        className="w-full aspect-square object-cover rounded-lg border border-slate-700"
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 border border-slate-700 text-white text-xs flex items-center justify-center"
                        title="Remove"
                        onClick={() => {
                          setParcelImages((prev) => prev.filter((_, i) => i !== idx))
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Receiver info */}
          <div className="form-section">
            <h3 className="font-display text-lg font-bold text-white mb-4">Receiver Information</h3>
            <div>
              <label className="label">Receiver Name</label>
              <input
                className="input"
                placeholder="Full name"
                value={form.receiverName}
                onChange={set('receiverName')}
                required
              />
            </div>
            <div>
              <label className="label">Receiver Phone</label>
              <input
                type="tel"
                className="input"
                placeholder="Mobile number"
                value={form.receiverPhone}
                onChange={set('receiverPhone')}
                required
              />
            </div>
            <div>
              <label className="label">Delivery Address</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Full delivery address"
                value={form.deliveryAddress}
                onChange={set('deliveryAddress')}
                required
              />
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

          {/* Instructions & disclaimer */}
          <div className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Customer Instructions & Disclaimer</p>
                <p className="text-xs text-slate-400 mt-1">
                  ParcelFlow only connects you and the driver. Payment is COD to the driver. Please read the rules before booking.
                </p>
              </div>
              <Link to="/customer-instructions" className="btn-secondary px-3 py-2 text-xs whitespace-nowrap">
                Read
              </Link>
            </div>
            <label className="mt-4 flex items-start gap-3 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-brand-500"
                checked={acceptedRules}
                onChange={(e) => setAcceptedRules(e.target.checked)}
              />
              <span>
                I have read and agree to the Customer Instructions & Disclaimer. I understand I am booking at my own risk.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || !acceptedRules}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          >
            {submitting && <Spinner size="sm" />}
            {submitting ? 'Confirming...' : estimatedTotal ? `Confirm Booking · ₹${estimatedTotal}` : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}
