// Spinner
export const Spinner = ({ size = 'md' }) => {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'
  return <div className={`${s} border-2 border-brand-500 border-t-transparent rounded-full animate-spin`} />
}

// Page loader
export const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Spinner size="lg" />
  </div>
)

// Status badge
export const StatusBadge = ({ status }) => {
  const map = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    delivered: 'badge-delivered',
    booked: 'badge-booked',
    cancelled: 'badge-cancelled',
    picked: 'badge-picked',
    'in-transit': 'badge-in-transit',
    completed: 'badge-delivered',
  }
  return <span className={map[status] || 'badge'}>{status}</span>
}

// Empty state
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    <div className="text-5xl mb-4">{icon || '📭'}</div>
    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
    {description && <p className="text-slate-400 text-sm mb-4 max-w-xs">{description}</p>}
    {action}
  </div>
)

// Stat card
export const StatCard = ({ label, value, sub, color = 'brand', icon }) => {
  const colors = {
    brand: 'text-brand-400 bg-brand-500/10',
    green: 'text-green-400 bg-green-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    red: 'text-red-400 bg-red-500/10',
  }
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        {icon && <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>}
      </div>
      <p className={`text-3xl font-display font-bold mt-2 ${colors[color].split(' ')[0]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

// Trip card
export const TripCard = ({ trip, onClick, action }) => {
  const date = new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div className="card-hover p-5 cursor-pointer animate-slide-up" onClick={onClick}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate">{trip.from}</span>
            <svg className="w-4 h-4 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span className="text-sm font-bold text-white truncate">{trip.to}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{date} • {trip.time}</p>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center border-t border-slate-800 pt-4">
        <div>
          <p className="text-xs text-slate-500">Capacity</p>
          <p className="text-sm font-semibold text-white">{trip.capacity}kg</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Available</p>
          <p className="text-sm font-semibold text-brand-400">{trip.availableSlots}kg</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Price/slot</p>
          <p className="text-sm font-semibold text-white">₹{trip.pricePerSlot}</p>
        </div>
      </div>

      {trip.driverId && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-slate-300">{trip.driverId.name?.[0] || '?'}</span>
          </div>
          <span className="text-xs text-slate-400">{trip.driverId.name}</span>
          <span className="text-xs text-slate-600">•</span>
          <span className="text-xs text-slate-400">{trip.driverId.phone}</span>
        </div>
      )}

      {action && <div className="mt-3" onClick={e => e.stopPropagation()}>{action}</div>}
    </div>
  )
}

// Confirmation modal
export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, loading, danger }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-sm w-full p-6 animate-slide-up">
        <h3 className="font-display text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 flex items-center justify-center gap-2 ${danger ? 'btn-danger' : 'btn-primary'}`}>
            {loading && <Spinner size="sm" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
