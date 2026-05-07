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

  const colorDotClass = (value) => {
    const v = (value || '').toString().trim().toLowerCase()
    const map = {
      black: 'bg-black',
      white: 'bg-white',
      red: 'bg-red-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      yellow: 'bg-yellow-400',
      grey: 'bg-slate-400',
      gray: 'bg-slate-400',
      silver: 'bg-slate-300',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
      purple: 'bg-purple-500',
      brown: 'bg-amber-700',
      maroon: 'bg-red-900',
    }
    return map[v] || 'bg-slate-500'
  }

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
        <EmptyState icon="ðŸ‘¤" title="No drivers found" description={`No ${filter} drivers`} />
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
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-white">
                              <svg className="w-4 h-4 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l2-5a2 2 0 011.8-1.2h10.4A2 2 0 0119 8l2 5" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13h14v6a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-6z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 13V9h10v4" />
                              </svg>
                              <span className="font-mono tracking-wide">{p.vehicleNumber}</span>
                            </span>

                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300 capitalize">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-400/80" />
                              {p.vehicleType}
                            </span>
                          </div>
                          {(p.vehicleName || p.vehicleColor) && (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {p.vehicleName && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-500/10 text-[11px] text-brand-200 border border-brand-500/20">
                                  <span className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-[10px] font-bold text-brand-200">
                                    {(p.vehicleName || '').trim().slice(0, 1).toUpperCase()}
                                  </span>
                                  <span className="text-[10px] uppercase tracking-wide text-brand-300/80">Vehicle Name</span>
                                  <span className="text-brand-200">·</span>
                                  <span className="max-w-[140px] truncate">{p.vehicleName}</span>
                                </span>
                              )}
                              {p.vehicleColor && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/70 text-[11px] text-slate-200 border border-slate-700 capitalize">
                                  <span className={`w-3 h-3 rounded-full ${colorDotClass(p.vehicleColor)} ${['white'].includes((p.vehicleColor || '').toLowerCase()) ? 'ring-1 ring-slate-600' : ''}`} />
                                  <span className="text-[10px] uppercase tracking-wide text-slate-400">Vehicle Color</span>
                                  <span className="text-slate-500">·</span>
                                  <span className="max-w-[120px] truncate">{p.vehicleColor}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : <span className="text-slate-600 text-xs">â€“</span>}
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
                        Review &rarr;
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


