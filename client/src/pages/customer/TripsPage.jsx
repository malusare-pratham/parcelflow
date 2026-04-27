import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { TripCard, PageLoader, EmptyState } from '../../components/UI'
import api from '../../utils/api'
import DateInput from '../../components/DateInput'
import { useAuth } from '../../context/AuthContext'
import CityCombobox from '../../components/CityCombobox'
import { CITY_OPTIONS } from '../../constants/cityOptions'

export default function TripsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const today = new Date().toLocaleDateString('en-CA')

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookedTripIds, setBookedTripIds] = useState(new Set())
  const [from, setFrom] = useState(searchParams.get('from') || '')
  const [to, setTo] = useState(searchParams.get('to') || '')
  const [date, setDate] = useState(searchParams.get('date') || '')

  const fetchMyBookings = async () => {
    if (!user || user.role !== 'customer') {
      setBookedTripIds(new Set())
      return
    }
    try {
      const { data } = await api.get('/customer/bookings/my')
      const ids = new Set(
        (data.bookings || [])
          .filter((b) => b.status !== 'cancelled')
          .map((b) => (b.tripId && (b.tripId._id || b.tripId))?.toString())
          .filter(Boolean)
      )
      setBookedTripIds(ids)
    } catch {
      setBookedTripIds(new Set())
    }
  }

  const fetchTrips = async () => {
    setLoading(true)
    try {
      const params = {}
      if (from) params.from = from
      if (to) params.to = to
      if (date) params.date = date
      const { data } = await api.get('/customer/trips', { params })
      setTrips(data.trips)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
    fetchMyBookings()
  }, [])

  useEffect(() => {
    fetchMyBookings()
  }, [user?._id, user?.role])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (from) params.from = from
    if (to) params.to = to
    if (date) params.date = date
    setSearchParams(params)
    fetchTrips()
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="card p-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <CityCombobox
              value={from}
              onChange={setFrom}
              options={CITY_OPTIONS}
              placeholder="Origin (type/select)"
              inputId="customer-trips-from"
              name="from"
            />
            <CityCombobox
              value={to}
              onChange={setTo}
              options={CITY_OPTIONS}
              placeholder="Destination (type/select)"
              inputId="customer-trips-to"
              name="to"
            />
            <div>
              <label className="label sm:hidden">Date</label>
              <DateInput value={date} onChange={e => setDate(e.target.value)} min={today} ariaLabel="Trip date" />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </div>
        </form>

        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Available Trips</h1>
            <p className="page-subtitle">{trips.length} trip{trips.length !== 1 ? 's' : ''} found</p>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : trips.length === 0 ? (
          <EmptyState
            icon="🚛"
            title="No trips found"
            description="Try adjusting your search criteria or check back later."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map(trip => (
              <TripCard
                key={trip._id}
                trip={trip}
                onClick={() => navigate(`/trips/${trip._id}`)}
                note={bookedTripIds.has(String(trip._id)) ? 'You already have a booking on this trip.' : null}
                action={
                  <button
                    onClick={() => navigate(`/trips/${trip._id}`)}
                    className="btn-primary w-full text-sm py-2"
                  >
                    View & Book →
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
