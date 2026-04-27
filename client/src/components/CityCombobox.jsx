import { useEffect, useMemo, useRef, useState } from 'react'

export default function CityCombobox({
  value,
  onChange,
  options,
  placeholder,
  required,
  inputId,
  name,
  disabled,
}) {
  const rootRef = useRef(null)
  const listboxId = useMemo(() => `${inputId || name || 'city'}-listbox`, [inputId, name])

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const query = value || ''
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((c) => c.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!rootRef.current) return
      if (rootRef.current.contains(e.target)) return
      setOpen(false)
      setActiveIndex(-1)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    if (!open) setActiveIndex(-1)
  }, [open])

  const commit = (city) => {
    onChange(city)
    setOpen(false)
    setActiveIndex(-1)
  }

  const onKeyDown = (e) => {
    if (disabled) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) setOpen(true)
      setActiveIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault()
        commit(filtered[activeIndex])
      }
      return
    }
    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
        setActiveIndex(-1)
      }
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={inputId}
        name={name}
        className="input pr-10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => !disabled && setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        required={required}
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Toggle city suggestions"
        tabIndex={-1}
      >
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full card overflow-hidden shadow-lg shadow-black/30">
          <div
            id={listboxId}
            role="listbox"
            className="max-h-56 overflow-auto py-1"
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-500">
                No matches. You can type a new city name.
              </div>
            ) : (
              filtered.map((city, idx) => (
                <button
                  type="button"
                  key={city}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    idx === activeIndex
                      ? 'bg-brand-500/10 text-brand-300'
                      : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(city)}
                >
                  {city}
                </button>
              ))
            )}
          </div>
          <div className="border-t border-slate-800 px-4 py-2 text-[11px] text-slate-500">
            Tip: If your city/taluka isn’t listed, just type it.
          </div>
        </div>
      )}
    </div>
  )
}
