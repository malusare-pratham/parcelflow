import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DriverLayout from '../../components/DriverLayout'
import { StatCard, StatusBadge, PageLoader } from '../../components/UI'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

export default function DriverDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [earnings, setEarnings] = useState(null)
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, earningsRes, bookingsRes] = await Promise.all([
          api.get('/driver/profile'),
          api.get('/driver/earnings'),
          api.get('/driver/bookings'),
        ])
        setProfile(profileRes.data.profile)
        setEarnings(earningsRes.data.earnings)
        setRecentBookings(bookingsRes.data.bookings.slice(0, 5))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <DriverLayout><PageLoader /></DriverLayout>

  const isVerified = profile?.verificationStatus === 'approved'
  const isPending = profile?.verificationStatus === 'pending'
  const isRejected = profile?.verificationStatus === 'rejected'
  const hasDocuments = profile?.aadhaar && profile?.license && profile?.vehicleImage && profile?.selfie

  return (
    <DriverLayout>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's your delivery overview</p>
      </div>

      {/* Verification status banner */}
      {!isVerified && (
        <div className={`rounded-2xl p-4 mb-6 border flex items-start gap-4 ${
          isRejected
            ? 'bg-red-500/10 border-red-500/20'
            : isPending
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-blue-500/10 border-blue-500/20'
        }`}>
          <span className="text-2xl mt-0.5">{isRejected ? '❌' : isPending ? '⏳' : '📋'}</span>
          <div className="flex-1">
            <p className={`font-semibold text-sm ${isRejected ? 'text-red-300' : isPending ? 'text-amber-300' : 'text-blue-300'}`}>
              {isRejected ? 'Verification Rejected' : isPending ? 'Verification Pending' : 'Complete Your KYC'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isRejected
                ? `Reason: ${profile?.rejectionReason || 'Contact support'}. Please re-upload your documents.`
                : isPending
                ? 'Your documents are under review. You will be notified once verified.'
                : 'Upload your Aadhaar, license, vehicle photo, and selfie to start creating trips.'}
            </p>
            {!hasDocuments || isRejected ? (
              <Link to="/driver/upload-docs" className="inline-block mt-2 text-xs font-semibold text-brand-400 hover:text-brand-300">
                Upload Documents →
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Earnings"
          value={`₹${earnings?.total || 0}`}
          sub="Collected in cash"
          color="brand"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Total Trips"
          value={earnings?.totalTrips || 0}
          sub="Created trips"
          color="blue"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
        />
        <StatCard
          label="Total Bookings"
          value={earnings?.totalBookings || 0}
          sub="Parcel slots booked"
          color="purple"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <StatCard
          label="Delivered"
          value={earnings?.deliveredCount || 0}
          sub="Successful deliveries"
          color="green"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/driver/create-trip" className={`card p-5 flex items-center gap-4 transition-all group ${isVerified ? 'hover:border-brand-500/40 cursor-pointer' : 'opacity-50 cursor-not-allowed pointer-events-none'}`}>
          <div className="w-12 h-12 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white">Create New Trip</p>
            <p className="text-xs text-slate-400">{isVerified ? 'Post a new route' : 'Requires verification'}</p>
          </div>
        </Link>

        <Link to="/driver/bookings" className="card p-5 flex items-center gap-4 hover:border-brand-500/40 transition-all group cursor-pointer">
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white">View Parcel Bookings</p>
            <p className="text-xs text-slate-400">Manage assigned parcels</p>
          </div>
        </Link>
      </div>

      {/* Recent bookings */}
      {recentBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">Recent Bookings</h2>
            <Link to="/driver/bookings" className="text-sm text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Weight</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b._id}>
                    <td><span className="font-mono text-xs text-brand-400">{b.bookingId}</span></td>
                    <td>{b.customerId?.name || '–'}</td>
                    <td className="text-xs">{b.tripId?.from} → {b.tripId?.to}</td>
                    <td>{b.parcelDetails?.weight}kg</td>
                    <td><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DriverLayout>
  )
}
