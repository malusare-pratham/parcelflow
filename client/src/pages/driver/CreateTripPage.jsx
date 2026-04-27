import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DriverLayout from '../../components/DriverLayout'
import { Spinner } from '../../components/UI'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import DateInput from '../../components/DateInput'
import CityCombobox from '../../components/CityCombobox'
import { CITY_OPTIONS } from '../../constants/cityOptions'

export default function CreateTripPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    from: '',
    pickupLocation: '',
    to: '',
    dropLocation: '',
    date: '',
    time: '',
    arrivalTime: '',
    capacity: '',
    pricePerKg: '',
    notes: '',
  })

  useEffect(() => {
    api.get('/driver/profile')
      .then(({ data }) => setProfile(data.profile))
      .finally(() => setLoading(false))
  }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        from: form.from.trim(),
        to: form.to.trim(),
        pickupLocation: form.pickupLocation.trim(),
        dropLocation: form.dropLocation.trim(),
        notes: form.notes?.trim() || '',
        arrivalTime: form.arrivalTime?.trim() || null,
        capacity: form.capacity === '' ? '' : Number(form.capacity),
        pricePerKg: form.pricePerKg === '' ? '' : Number(form.pricePerKg),
      }

      await api.post('/driver/create-trip', payload)
      toast.success('Trip created! Awaiting admin approval.')
      navigate('/driver/trips')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create trip')
    } finally {
      setSubmitting(false)
    }
  }

  // Use local date (not UTC) so the min date doesn't shift by timezone.
  const today = new Date().toLocaleDateString('en-CA')

  return (
    <DriverLayout>
      <div className="max-w-xl">
        <div className="page-header">
          <h1 className="page-title">Create New Trip</h1>
          <p className="page-subtitle">Post your route and start earning from parcel deliveries</p>
        </div>

        {!loading && profile?.verificationStatus !== 'approved' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 text-sm text-red-300">
            You must be verified by admin before creating trips.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route */}
          <div className="form-section">
            <h3 className="font-display text-base font-bold text-white mb-4">Route Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Origin (City)</label>
                <CityCombobox
                  value={form.from}
                  onChange={(v) => setForm((p) => ({ ...p, from: v }))}
                  options={CITY_OPTIONS}
                  placeholder="Select a district (or type any city/taluka)"
                  required
                  inputId="trip-from-city"
                  name="from"
                />
                <label className="label mt-3">Pickup Location</label>
                <input className="input" placeholder="e.g. Swargate, Pune" value={form.pickupLocation} onChange={set('pickupLocation')} required />
              </div>
              <div>
                <label className="label">Destination (City)</label>
                <CityCombobox
                  value={form.to}
                  onChange={(v) => setForm((p) => ({ ...p, to: v }))}
                  options={CITY_OPTIONS}
                  placeholder="Select a district (or type any city/taluka)"
                  required
                  inputId="trip-to-city"
                  name="to"
                />
                <label className="label mt-3">Drop Location</label>
                <input className="input" placeholder="e.g. Dadar, Mumbai" value={form.dropLocation} onChange={set('dropLocation')} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="label">Date</label>
                <DateInput
                  value={form.date}
                  onChange={set('date')}
                  min={today}
                  required
                  ariaLabel="Trip date"
                />
              </div>
              <div>
                <label className="label">Departure Time</label>
                <input type="time" className="input" value={form.time} onChange={set('time')} required />
              </div>
               <div>
                <label className="label">Arrival Time (Optional)</label>
                <input type="time" className="input" value={form.arrivalTime} onChange={set('arrivalTime')} />
              </div>
            </div>
          </div>

          {/* Capacity & Price */}
          <div className="form-section">
            <h3 className="font-display text-base font-bold text-white mb-4">Capacity & Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Capacity (kg)</label>
                <input type="number" min="1" max="1000" className="input" placeholder="e.g. 50" value={form.capacity} onChange={set('capacity')} required />
                <p className="text-xs text-slate-500 mt-1">Max weight you can carry</p>
              </div>
              <div>
                <label className="label">Price per Kg (₹)</label>
                <input type="number" min="0" className="input" placeholder="e.g. 50" value={form.pricePerKg} onChange={set('pricePerKg')} required />
                <p className="text-xs text-slate-500 mt-1">Customer pays based on weight (cash on delivery)</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-section">
            <h3 className="font-display text-base font-bold text-white mb-4">Additional Notes (Optional)</h3>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Any special instructions, stop points, or parcel restrictions..."
              value={form.notes}
              onChange={set('notes')}
            />
          </div>

          {/* Preview card */}
          {form.from && form.to && (
            <div className="card p-4 border-brand-500/20">
              <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Trip Preview</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-white">{form.from}</span>
                <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="font-bold text-white">{form.to}</span>
              </div>
              {(form.pickupLocation || form.dropLocation) && (
                <p className="text-xs text-slate-400 mb-3">
                  Pickup: <span className="text-slate-300">{form.pickupLocation || '—'}</span>
                  <span className="text-slate-600"> • </span>
                  Drop: <span className="text-slate-300">{form.dropLocation || '—'}</span>
                </p>
              )}
              <p className="text-xs text-slate-400 mb-3">
                Time:{' '}
                <span className="text-slate-300">
                  {form.time || '-'}
                  {form.arrivalTime ? ` -> ${form.arrivalTime}` : ''}
                </span>
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <p className="text-slate-500">Date</p>
                  <p className="text-white font-medium">{form.date || '–'}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <p className="text-slate-500">Capacity</p>
                  <p className="text-white font-medium">{form.capacity ? `${form.capacity}kg` : '–'}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <p className="text-slate-500">Price</p>
                  <p className="text-brand-400 font-medium">{form.pricePerKg ? `₹${form.pricePerKg}/kg` : '–'}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || profile?.verificationStatus !== 'approved'}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {submitting && <Spinner size="sm" />}
            {submitting ? 'Creating...' : 'Submit Trip for Approval →'}
          </button>
        </form>
      </div>
    </DriverLayout>
  )
}
