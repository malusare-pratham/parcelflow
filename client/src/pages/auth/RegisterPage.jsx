import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/UI'

const isSafeNextPath = (value) => {
  if (!value) return false
  if (typeof value !== 'string') return false
  if (!value.startsWith('/')) return false
  if (value.startsWith('//')) return false
  return true
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '', role: 'customer' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }
    setLoading(true)
    try {
      const user = await register({ name: form.name, phone: form.phone, email: form.email, password: form.password, role: form.role })
      toast.success('Account created successfully!')
      const next = searchParams.get('next')
      if (isSafeNextPath(next)) {
        navigate(next, { replace: true })
        return
      }
      if (user.role === 'driver') navigate('/driver/upload-docs', { replace: true })
      else navigate('/', { replace: true })
    } catch (err) {
      // Network/CORS errors often have no `response`, so fall back to `err.message`
      console.error('Registration error:', err)
      toast.error(err.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join the ParcelFlow network</p>
        </div>

        <form onSubmit={handleSubmit} className="form-section">
          {/* Role selector */}
          <div>
            <label className="label">I want to join as</label>
            <div className="grid grid-cols-2 gap-3">
              {['customer', 'driver'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, role }))}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all capitalize
                    ${form.role === role
                      ? 'bg-brand-500/10 border-brand-500/50 text-brand-400'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                >
                  {role === 'customer' ? '📦 Customer' : '🚗 Driver'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Full Name</label>
            <input type="text" className="input" placeholder="Your full name" value={form.name} onChange={set('name')} required />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input type="tel" className="input" placeholder="10-digit mobile" value={form.phone} onChange={set('phone')} required />
          </div>

          <div>
            <label className="label">Email (Optional)</label>
            <input type="email" className="input" placeholder="your@email.com" value={form.email} onChange={set('email')} />
          </div>

          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required />
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input type="password" className="input" placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
          </div>

          {form.role === 'driver' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
              ⚠️ After registration, you'll need to upload your KYC documents and wait for admin verification before creating trips.
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading && <Spinner size="sm" />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to={isSafeNextPath(searchParams.get('next')) ? `/login?next=${encodeURIComponent(searchParams.get('next'))}` : '/login'} className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
