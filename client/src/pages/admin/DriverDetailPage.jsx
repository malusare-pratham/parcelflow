import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { StatusBadge, PageLoader, Spinner, TripCard } from '../../components/UI'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || '/uploads'

const DocPreview = ({ label, filename }) => {
  if (!filename) return (
    <div className="border border-dashed border-slate-700 rounded-xl p-4 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xs text-slate-600 mt-1">Not uploaded</p>
    </div>
  )
  const url = /^https?:\/\//i.test(filename) ? filename : `${UPLOADS_URL}/${filename}`
  const isImage = /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      {isImage ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={label} className="w-full h-32 object-cover hover:opacity-90 transition-opacity" />
        </a>
      ) : (
        <a href={url} target="_blank" rel="noreferrer"
          className="flex items-center justify-center h-24 bg-slate-800 hover:bg-slate-700 transition-colors">
          <div className="text-center">
            <span className="text-3xl">📄</span>
            <p className="text-xs text-brand-400 mt-1">View PDF</p>
          </div>
        </a>
      )}
      <div className="px-3 py-2 bg-slate-800/50">
        <p className="text-xs font-semibold text-slate-300">{label}</p>
      </div>
    </div>
  )
}

export default function DriverDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const load = () => {
    setLoading(true)
    api.get(`/admin/drivers/${id}`)
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleVerify = async (status) => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      return toast.error('Please provide a rejection reason')
    }
    setSubmitting(true)
    try {
      await api.put(`/admin/verify-driver/${id}`, { status, rejectionReason })
      toast.success(`Driver ${status} successfully`)
      load()
      setShowRejectForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <AdminLayout><PageLoader /></AdminLayout>
  if (!data) return null

  const { driver, profile, trips } = data

  return (
    <AdminLayout>
      <Link to="/admin/drivers" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to drivers
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Driver info + actions */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-brand-400">{driver.name[0]}</span>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">{driver.name}</h2>
                <p className="text-sm text-slate-400">{driver.phone}</p>
                {driver.email && <p className="text-xs text-slate-500">{driver.email}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <div>
                <p className="text-xs text-slate-500">KYC Status</p>
                <StatusBadge status={profile?.verificationStatus || 'pending'} />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Joined</p>
                <p className="text-xs text-slate-300">{new Date(driver.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Vehicle info */}
          {profile && (
            <div className="card p-5">
              <p className="label mb-3">Vehicle Information</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Number</span>
                  <span className="text-white font-medium">{profile.vehicleNumber || '–'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="text-white capitalize">{profile.vehicleType || '–'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Trips</span>
                  <span className="text-white">{trips.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {profile?.verificationStatus !== 'approved' && (
            <div className="card p-5 space-y-3">
              <p className="label">Verification Actions</p>
              <button
                onClick={() => handleVerify('approved')}
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting && <Spinner size="sm" />}
                ✅ Approve Driver
              </button>
              {!showRejectForm ? (
                <button onClick={() => setShowRejectForm(true)} className="btn-danger w-full">
                  ❌ Reject Driver
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    className="input resize-none text-sm"
                    rows={3}
                    placeholder="Reason for rejection (required)..."
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowRejectForm(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                    <button onClick={() => handleVerify('rejected')} disabled={submitting} className="btn-danger flex-1 text-sm flex items-center justify-center gap-1">
                      {submitting && <Spinner size="sm" />} Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {profile?.verificationStatus === 'approved' && (
            <div className="card p-4 border-green-500/20">
              <div className="flex items-center gap-2 text-green-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm font-semibold">Driver Verified</span>
              </div>
              <button onClick={() => handleVerify('rejected')} className="mt-3 text-xs text-red-400 hover:text-red-300">
                Revoke Verification
              </button>
            </div>
          )}
        </div>

        {/* Right: Documents + Trips */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <p className="label mb-4">Submitted Documents</p>
            <div className="grid grid-cols-2 gap-3">
              <DocPreview label="Aadhaar Card" filename={profile?.aadhaar} />
              <DocPreview label="Driving License" filename={profile?.license} />
              <DocPreview label="Vehicle Photo" filename={profile?.vehicleImage} />
              <DocPreview label="Selfie" filename={profile?.selfie} />
            </div>
          </div>

          {trips.length > 0 && (
            <div>
              <p className="label mb-3">Driver's Trips ({trips.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trips.slice(0, 4).map(trip => <TripCard key={trip._id} trip={trip} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
