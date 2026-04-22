const formatDateDMY = (value) => {
  if (!value) return ''
  const parts = String(value).split('-')
  if (parts.length !== 3) return value
  const [yyyy, mm, dd] = parts
  if (!yyyy || !mm || !dd) return value
  return `${dd}/${mm}/${yyyy}`
}

export default function DateInput({
  value,
  onChange,
  min,
  required,
  placeholder = 'DD/MM/YYYY',
  ariaLabel = 'Date',
}) {
  const display = value ? formatDateDMY(value) : placeholder

  return (
    <div className="relative rounded-xl focus-within:ring-2 focus-within:ring-brand-500/50">
      <input
        type="date"
        className="input absolute inset-0 z-10 opacity-0"
        value={value}
        onChange={onChange}
        min={min}
        required={required}
        aria-label={ariaLabel}
      />

      <div
        aria-hidden="true"
        className={`input flex items-center pr-10 ${value ? 'text-slate-100' : 'text-slate-500'}`}
      >
        {display}
      </div>

      <div
        aria-hidden="true"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  )
}

