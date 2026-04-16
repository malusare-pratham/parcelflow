import { useState, useEffect } from 'react'
import DriverLayout from '../../components/DriverLayout'
import { StatusBadge, Spinner } from '../../components/UI'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || '/uploads'

const FileInput = ({ label, name, file, onChange, hint, existing }) => (
  <div>
    <label className="label">{label}</label>
    {existing && (
      <div className="mb-2 flex items-center gap-2 text-xs text-green-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        Previously uploaded · <a href={`${UPLOADS_URL}/${existing}`} target="_blank" rel="noreferrer" className="underline">View</a>
      </div>
    )}
    <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors
      ${file ? 'border-brand-500/60 bg-brand-500/5' : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'}`}>
      <div className="text-center px-3">
        {file ? (
          <>
            <p className="text-sm font-medium text-brand-400 truncate max-w-[200px]">{file.name}</p>
            <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
          </>
        ) : (
          <>
            <svg className="w-7 h-7 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-xs text-slate-400">Click to upload {label}</p>
            <p className="text-xs text-slate-600 mt-0.5">{hint}</p>
          </>
        )}
      </div>
      <input type="file" name={name} accept="image/*,application/pdf" className="hidden" onChange={onChange} />
    </label>
  </div>
)

export default function UploadDocsPage() {
  const [profile, setProfile] = useState(null)
  const [files, setFiles] = useState({ aadhaar: null, license: null, vehicleImage: null, selfie: null })
  const [vehicle, setVehicle] = useState({ vehicleNumber: '', vehicleType: 'bike' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/driver/profile')
      .then(({ data }) => {
        setProfile(data.profile)
        if (data.profile?.vehicleNumber) setVehicle(v => ({ ...v, vehicleNumber: data.profile.vehicleNumber }))
        if (data.profile?.vehicleType) setVehicle(v => ({ ...v, vehicleType: data.profile.vehicleType }))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleFile = (name) => (e) => {
    const f = e.target.files[0]
    if (f && f.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB'); return }
    setFiles(p => ({ ...p, [name]: f }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const hasAtLeastOne = Object.values(files).some(Boolean)
    if (!hasAtLeastOne && !vehicle.vehicleNumber) return toast.error('Please upload at least one document or update vehicle info')
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v) })
      fd.append('vehicleNumber', vehicle.vehicleNumber)
      fd.append('vehicleType', vehicle.vehicleType)
      await api.post('/driver/upload-docs', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Documents submitted! Awaiting admin review.')
      const { data } = await api.get('/driver/profile')
      setProfile(data.profile)
      setFiles({ aadhaar: null, license: null, vehicleImage: null, selfie: null })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  const statusColors = { pending: 'amber', approved: 'green', rejected: 'red' }

  return (
    <DriverLayout>
      <div className="max-w-2xl">
        <div className="page-header">
          <h1 className="page-title">KYC Verification</h1>
          <p className="page-subtitle">Upload documents to get verified and start accepting parcels</p>
        </div>

        {/* Status card */}
        {profile && (
          <div className="card p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Verification Status</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {profile.verificationStatus === 'approved'
                  ? 'You are fully verified!'
                  : profile.verificationStatus === 'pending'
                  ? 'Under review by admin'
                  : `Rejected: ${profile.rejectionReason || 'Please re-upload'}`}
              </p>
            </div>
            <StatusBadge status={profile.verificationStatus} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle info */}
          <div className="form-section">
            <h3 className="font-display text-base font-bold text-white mb-4">Vehicle Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Vehicle Number</label>
                <input className="input" placeholder="MH12AB1234" value={vehicle.vehicleNumber}
                  onChange={e => setVehicle(p => ({ ...p, vehicleNumber: e.target.value }))} />
              </div>
              <div>
                <label className="label">Vehicle Type</label>
                <select className="input" value={vehicle.vehicleType}
                  onChange={e => setVehicle(p => ({ ...p, vehicleType: e.target.value }))}>
                  {['bike', 'auto', 'car', 'van', 'truck'].map(t => (
                    <option key={t} value={t} className="bg-slate-800 capitalize">{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="form-section">
            <h3 className="font-display text-base font-bold text-white mb-4">Identity & Vehicle Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileInput label="Aadhaar Card" name="aadhaar" file={files.aadhaar}
                onChange={handleFile('aadhaar')} hint="JPG, PNG or PDF · Max 5MB"
                existing={profile?.aadhaar} />
              <FileInput label="Driving License" name="license" file={files.license}
                onChange={handleFile('license')} hint="JPG, PNG or PDF · Max 5MB"
                existing={profile?.license} />
              <FileInput label="Vehicle Photo" name="vehicleImage" file={files.vehicleImage}
                onChange={handleFile('vehicleImage')} hint="Clear photo of your vehicle"
                existing={profile?.vehicleImage} />
              <FileInput label="Selfie with Vehicle" name="selfie" file={files.selfie}
                onChange={handleFile('selfie')} hint="You next to your vehicle"
                existing={profile?.selfie} />
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">📋 Submission Guidelines</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>All documents must be clear and legible</li>
              <li>Aadhaar and License must not be expired</li>
              <li>Admin review typically takes 24–48 hours</li>
              <li>You'll be notified of the decision</li>
            </ul>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {submitting && <Spinner size="sm" />}
            {submitting ? 'Uploading...' : 'Submit Documents'}
          </button>
        </form>
      </div>
    </DriverLayout>
  )
}
