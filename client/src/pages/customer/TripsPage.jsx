import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { TripCard, PageLoader, EmptyState } from '../../components/UI'
import api from '../../utils/api'

export default function TripsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(searchParams.get('from') || '')
  const [to, setTo] = useState(searchParams.get('to') || '')
  const [date, setDate] = useState(searchParams.get('date') || '')

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

  useEffect(() => { fetchTrips() }, [])

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
            <input className="input" placeholder="From city" value={from} onChange={e => setFrom(e.target.value)} />
            <input className="input" placeholder="To city" value={to} onChange={e => setTo(e.target.value)} />
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
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
