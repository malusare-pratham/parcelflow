import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DriverLayout from '../../components/DriverLayout'
import { TripCard, PageLoader, EmptyState } from '../../components/UI'
import api from '../../utils/api'

export default function DriverTripsPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/driver/trips')
      .then(({ data }) => setTrips(data.trips))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? trips : trips.filter(t => t.status === filter)
  const tabs = ['all', 'pending', 'approved', 'rejected', 'completed']

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
            {tab} {tab === 'all' ? `(${trips.length})` : `(${trips.filter(t => t.status === tab).length})`}
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
            <TripCard key={trip._id} trip={trip} />
          ))}
        </div>
      )}
    </DriverLayout>
  )
}
