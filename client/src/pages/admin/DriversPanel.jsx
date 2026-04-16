import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { StatusBadge, PageLoader, EmptyState } from '../../components/UI'
import api from '../../utils/api'

export default function DriversPanel() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const status = searchParams.get('status')
    if (status) setFilter(status)
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    const params = filter !== 'all' ? { status: filter } : {}
    api.get('/admin/drivers', { params })
      .then(({ data }) => setDrivers(data.drivers))
      .finally(() => setLoading(false))
  }, [filter])

  const tabs = ['all', 'pending', 'approved', 'rejected']

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title">Driver Verification</h1>
        <p className="page-subtitle">Review and approve driver KYC submissions</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
              ${filter === tab ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : drivers.length === 0 ? (
        <EmptyState icon="👤" title="No drivers found" description={`No ${filter} drivers`} />
      ) : (
        <div className="table-wrapper animate-fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Phone</th>
                <th>Vehicle</th>
                <th>Documents</th>
                <th>KYC Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => {
                const p = d.profile
                const docCount = [p?.aadhaar, p?.license, p?.vehicleImage, p?.selfie].filter(Boolean).length
                return (
                  <tr key={d._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-slate-300">
                          {d.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{d.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{d.phone}</td>
                    <td>
                      {p?.vehicleNumber ? (
                        <div>
                          <p className="text-xs font-medium text-white">{p.vehicleNumber}</p>
                          <p className="text-xs text-slate-500 capitalize">{p.vehicleType}</p>
                        </div>
                      ) : <span className="text-slate-600 text-xs">–</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {[
                          { key: 'aadhaar', label: 'A' },
                          { key: 'license', label: 'L' },
                          { key: 'vehicleImage', label: 'V' },
                          { key: 'selfie', label: 'S' },
                        ].map(doc => (
                          <span key={doc.key}
                            className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold
                              ${p?.[doc.key] ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-600'}`}
                            title={doc.key}>
                            {doc.label}
                          </span>
                        ))}
                        <span className="text-xs text-slate-500 ml-1">{docCount}/4</span>
                      </div>
                    </td>
                    <td><StatusBadge status={p?.verificationStatus || 'pending'} /></td>
                    <td className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <button
                        onClick={() => navigate(`/admin/drivers/${d._id}`)}
                        className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
