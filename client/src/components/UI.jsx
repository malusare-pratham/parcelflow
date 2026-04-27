import { FA, Icons } from './fa'

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
    confirmed: 'badge-approved',
    rejected: 'badge-rejected',
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
    <div className="text-5xl mb-4">{icon || <FA icon={Icons.boxOpen} />}</div>
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
export const TripCard = ({ trip, onClick, action, note }) => {
  const date = new Date(trip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeLabel = trip.arrivalTime ? `${trip.time} -> ${trip.arrivalTime}` : trip.time
  const driverPhone = trip?.driverId?.phone ? String(trip.driverId.phone).replace(/[^\d+]/g, '') : null
  const durationLabel = (() => {
    if (!trip?.time || !trip?.arrivalTime) return null
    const match = (t) => String(t).trim().match(/^(\d{1,2}):(\d{2})$/)
    const startMatch = match(trip.time)
    const endMatch = match(trip.arrivalTime)
    if (!startMatch || !endMatch) return null
    const start = Number(startMatch[1]) * 60 + Number(startMatch[2])
    const end = Number(endMatch[1]) * 60 + Number(endMatch[2])
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null
    let diff = end - start
    if (diff < 0) diff += 24 * 60
    const h = Math.floor(diff / 60)
    const m = diff % 60
    if (h <= 0 && m <= 0) return null
    if (h > 0 && m > 0) return `${h}h${m}`
    if (h > 0) return `${h}h`
    return `${m}m`
  })()
  return (
    <div className="card-hover p-5 cursor-pointer animate-slide-up" onClick={onClick}>
      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0 flex flex-col items-center">
          <div className="flex items-end justify-center gap-12 sm:gap-8 text-center">
            <div className="min-w-0">
              <p className="text-xl sm:text-lg font-bold text-white">{trip.from}</p>
              {trip.time && <p className="text-xs sm:text-sm text-slate-400 mt-1">{trip.time}</p>}
            </div>

            <span className="relative flex-shrink-0 pb-1">
              {durationLabel && (
                <span className="absolute -top-6 sm:-top-5 left-1/2 -translate-x-1/2 text-base sm:text-sm font-semibold text-slate-400 whitespace-nowrap">
                  {durationLabel}
                </span>
              )}
              <span className="flex items-center justify-center">
                <span className="h-[2px] w-6 sm:w-7 bg-brand-500/70 rounded-full" />
                <span className="mx-1 text-brand-500">
                  <FA icon={Icons.arrowRight} className="w-5 h-5 sm:w-5 sm:h-5" />
                </span>
                <span className="h-[2px] w-6 sm:w-7 bg-brand-500/70 rounded-full" />
              </span>
            </span>

            <div className="min-w-0">
              <p className="text-xl sm:text-lg font-bold text-white">{trip.to}</p>
              {trip.arrivalTime && <p className="text-xs sm:text-sm text-slate-400 mt-1">{trip.arrivalTime}</p>}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-3 text-center">{date}</p>
        </div>
        {trip.status !== 'approved' && (
          <div className="absolute top-0 right-0">
            <StatusBadge status={trip.status} />
          </div>
        )}
      </div>

      {note && (
        <div className="mb-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-300">
          {note}
        </div>
      )}

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
          <p className="text-xs text-slate-500">Price/kg</p>
          <p className="text-sm font-semibold text-white">₹{trip.pricePerKg ?? trip.pricePerSlot}</p>
        </div>
      </div>

      {(trip.pickupLocation || trip.dropLocation) && (
        <div className="mt-3 text-xs text-slate-400 truncate">
          <span className="text-slate-500 font-semibold">Pickup:</span> {trip.pickupLocation || '—'}
          <span className="text-slate-600"> • </span>
          <span className="text-slate-500 font-semibold">Drop:</span> {trip.dropLocation || '—'}
        </div>
      )}

      {trip.driverId && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-slate-300">{trip.driverId.name?.[0] || '?'}</span>
          </div>
          <span className="text-sm font-semibold text-slate-200">{trip.driverId.name}</span>
          <span className="text-xs text-slate-600">•</span>
          {driverPhone ? (
            <a
              href={`tel:${driverPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="ml-auto inline-flex items-center gap-2 px-3 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:border-brand-500/40 hover:text-brand-300 transition-colors"
              title="Call driver"
              aria-label={`Call ${trip.driverId.name || 'driver'}`}
            >
              <FA icon={Icons.phone} />
              <span className="text-xs font-semibold">Call</span>
            </a>
          ) : (
            <span className="ml-auto text-xs text-slate-500">No phone</span>
          )}
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
