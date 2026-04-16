import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { PageLoader, EmptyState, Spinner } from '../../components/UI'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function CustomersPanel() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)
  const [search, setSearch] = useState('')

  const fetchCustomers = () => {
    setLoading(true)
    api.get('/admin/customers')
      .then(({ data }) => setCustomers(data.customers))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCustomers() }, [])

  const toggleStatus = async (id, name, isActive) => {
    setToggling(id)
    try {
      await api.put(`/admin/users/${id}/toggle`)
      toast.success(`${name} ${isActive ? 'deactivated' : 'activated'}`)
      fetchCustomers()
    } catch (err) {
      toast.error('Action failed')
    } finally {
      setToggling(null)
    }
  }

  const filtered = customers.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.email?.toLowerCase().includes(s)
  })

  return (
    <AdminLayout>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} registered customers</p>
        </div>
      </div>

      <div className="mb-6">
        <input
          className="input max-w-xs text-sm"
          placeholder="Search name, phone, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon="👥" title="No customers found" />
      ) : (
        <div className="table-wrapper animate-fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-slate-300">
                        {c.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{c.phone}</td>
                  <td className="text-xs text-slate-400">{c.email || '–'}</td>
                  <td>
                    <span className={`badge ${c.isActive ? 'badge-approved' : 'badge-rejected'}`}>
                      {c.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <button
                      onClick={() => toggleStatus(c._id, c.name, c.isActive)}
                      disabled={toggling === c._id}
                      className={`text-xs font-medium flex items-center gap-1 ${c.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                    >
                      {toggling === c._id && <Spinner size="sm" />}
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
