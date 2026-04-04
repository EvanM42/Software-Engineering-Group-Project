import { useState, useRef, useEffect } from 'react'

export default function StopAutocomplete({
  stops,
  value,
  onChange,
  onSelect,
  placeholder,
  id,
}) {
  const [query, setQuery] = useState(value || '')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef(null)

  const filtered = query.trim()
    ? stops.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  // Sync external value changes
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    onChange?.(val)
    setIsOpen(val.trim().length > 0)
    setHighlightIndex(-1)
  }

  function handleSelect(stop) {
    setQuery(stop.name)
    onChange?.(stop.name)
    onSelect?.(stop)
    setIsOpen(false)
    setHighlightIndex(-1)
  }

  function handleKeyDown(e) {
    if (!isOpen || filtered.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1
      )
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      handleSelect(filtered[highlightIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.trim() && setIsOpen(true)}
        autoComplete="off"
      />

      {isOpen && filtered.length > 0 && (
        <ul className="autocomplete-dropdown" role="listbox">
          {filtered.map((stop, i) => (
            <li
              key={stop.id}
              role="option"
              aria-selected={i === highlightIndex}
              className={`autocomplete-item ${
                i === highlightIndex ? 'autocomplete-item--active' : ''
              }`}
              onClick={() => handleSelect(stop)}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <span className="autocomplete-item-icon">📍</span>
              <div className="autocomplete-item-content">
                <span className="autocomplete-item-name">{stop.name}</span>
                {stop.route_names?.length > 0 && (
                  <span className="autocomplete-item-routes">
                    {stop.route_names.slice(0, 3).join(' • ')}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
