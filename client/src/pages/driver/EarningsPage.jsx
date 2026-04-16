import { useState, useEffect } from 'react'
import DriverLayout from '../../components/DriverLayout'
import { StatCard, PageLoader } from '../../components/UI'
import api from '../../utils/api'

export default function EarningsPage() {
  const [earnings, setEarnings] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/driver/earnings'), api.get('/driver/bookings')])
      .then(([eRes, bRes]) => {
        setEarnings(eRes.data.earnings)
        setBookings(bRes.data.bookings.filter(b => b.status === 'delivered'))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DriverLayout><PageLoader /></DriverLayout>

  return (
    <DriverLayout>
      <div className="page-header">
        <h1 className="page-title">Earnings</h1>
        <p className="page-subtitle">Your delivery income overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Earnings" value={`₹${earnings?.total || 0}`} sub="Cash collected" color="brand"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard label="Trips Completed" value={earnings?.totalTrips || 0} sub="Total trips" color="blue"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
        />
        <StatCard label="Deliveries Done" value={earnings?.deliveredCount || 0} sub="Parcels delivered" color="green"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        />
        <StatCard label="Avg Per Delivery" value={earnings?.deliveredCount ? `₹${Math.round(earnings.total / earnings.deliveredCount)}` : '₹0'} sub="Per parcel" color="amber"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
      </div>

      {/* Payment info banner */}
      <div className="card p-5 mb-8 flex items-start gap-4">
        <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">💵</span>
        </div>
        <div>
          <p className="font-semibold text-white mb-1">Cash on Delivery Model</p>
          <p className="text-sm text-slate-400">All payments are collected directly from customers upon delivery. There are no platform fees or deductions — you keep 100% of what you earn.</p>
        </div>
      </div>

      {/* Delivered bookings history */}
      {bookings.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-white mb-4">Delivery History</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Route</th>
                  <th>Customer</th>
                  <th>Parcel</th>
                  <th>Earned</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td><span className="font-mono text-xs text-brand-400">{b.bookingId}</span></td>
                    <td className="text-xs">{b.tripId?.from} → {b.tripId?.to}</td>
                    <td>{b.customerId?.name || '–'}</td>
                    <td className="text-xs">{b.parcelDetails?.description} · {b.parcelDetails?.weight}kg</td>
                    <td><span className="text-green-400 font-semibold">₹{b.amount}</span></td>
                    <td className="text-xs">{new Date(b.updatedAt).toLocaleDateString('en-IN')}</td>
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
