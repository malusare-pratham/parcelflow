import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { StatusBadge, PageLoader, EmptyState, Spinner, ConfirmModal } from '../../components/UI'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function TripsPanel() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [searchParams] = useSearchParams()
  const [actionModal, setActionModal] = useState({ open: false, trip: null, action: null })
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const s = searchParams.get('status')
    if (s) setFilter(s)
  }, [searchParams])

  const fetchTrips = () => {
    setLoading(true)
    const params = filter !== 'all' ? { status: filter } : {}
    api.get('/admin/trips', { params })
      .then(({ data }) => setTrips(data.trips))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTrips() }, [filter])

  const handleAction = async () => {
    const { trip, action } = actionModal
    if (action === 'rejected' && !rejectionReason.trim()) return toast.error('Please provide a rejection reason')
    setSubmitting(true)
    try {
      await api.put(`/admin/trips/${trip._id}/status`, { status: action, rejectionReason })
      toast.success(`Trip ${action}`)
      setActionModal({ open: false, trip: null, action: null })
      setRejectionReason('')
      fetchTrips()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = ['pending', 'approved', 'rejected', 'all']

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">Trip Approvals</h1>
        <p className="page-subtitle">Review and approve driver trip submissions</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
              ${filter === tab ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {tab} ({trips.filter(t => tab === 'all' ? true : t.status === tab).length || (loading ? '...' : 0)})
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : trips.length === 0 ? (
        <EmptyState icon="🚦" title="No trips found" description={`No ${filter} trips to review`} />
      ) : (
        <div className="space-y-4 animate-fade-in">
          {trips.map(trip => {
            const date = new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <div key={trip._id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-display font-bold text-white">
                        {trip.from} <span className="text-brand-500">→</span> {trip.to}
                      </h3>
                      <StatusBadge status={trip.status} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-400">
                      <span>📅 {date} · {trip.time}</span>
                      <span>⚖️ {trip.capacity}kg capacity</span>
                      <span>💰 ₹{trip.pricePerSlot}/slot</span>
                      <span>🚗 {trip.driverId?.name} · {trip.driverId?.phone}</span>
                    </div>
                    {trip.notes && <p className="text-xs text-slate-500 mt-2">Note: {trip.notes}</p>}
                    {trip.rejectionReason && (
                      <p className="text-xs text-red-400 mt-2">Rejection: {trip.rejectionReason}</p>
                    )}
                  </div>

                  {trip.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setActionModal({ open: true, trip, action: 'approved' })}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => setActionModal({ open: true, trip, action: 'rejected' })}
                        className="btn-danger text-xs py-1.5 px-3"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Action modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 animate-slide-up">
            <h3 className="font-display text-lg font-bold text-white mb-2">
              {actionModal.action === 'approved' ? '✅ Approve Trip' : '❌ Reject Trip'}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {actionModal.trip?.from} → {actionModal.trip?.to} · {new Date(actionModal.trip?.date).toLocaleDateString('en-IN')}
            </p>
            {actionModal.action === 'rejected' && (
              <div className="mb-4">
                <label className="label">Rejection Reason (Required)</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Explain why this trip is being rejected..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setActionModal({ open: false, trip: null, action: null }); setRejectionReason('') }}
                className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAction} disabled={submitting}
                className={`flex-1 flex items-center justify-center gap-2 ${actionModal.action === 'approved' ? 'btn-primary' : 'btn-danger'}`}>
                {submitting && <Spinner size="sm" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
