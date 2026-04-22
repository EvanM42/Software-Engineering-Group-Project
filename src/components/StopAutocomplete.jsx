import { useMemo, useState, useRef, useEffect } from 'react'
import { getRouteBadgeStyle } from '../utils/routeStyles'

export default function StopAutocomplete({
  stops,
  nearbyStops = [],
  value,
  onChange,
  onSelect,
  placeholder,
  id,
  routeStyleMap,
}) {
  const [query, setQuery] = useState(value || '')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef(null)

  // keep the dropdown grouped by nearby and full stop results
  const normalizedQuery = query.trim().toLowerCase()

  const dropdownSections = useMemo(() => {
    const allStops = [...stops].sort((left, right) => left.name.localeCompare(right.name))

    if (!normalizedQuery) {
      const nearby = nearbyStops.slice(0, 5)
      const nearbyIds = new Set(nearby.map((stop) => stop.id))
      const remainingStops = allStops.filter((stop) => !nearbyIds.has(stop.id))

      return [
        ...(nearby.length ? [{ label: 'Nearby stops', items: nearby }] : []),
        { label: 'All stops', items: remainingStops },
      ].filter((section) => section.items.length)
    }

    const matches = allStops.filter((stop) =>
      stop.name.toLowerCase().includes(normalizedQuery) ||
      (stop.route_names || []).some((route) => route.toLowerCase().includes(normalizedQuery))
    )

    return matches.length ? [{ label: 'Matching stops', items: matches }] : []
  }, [stops, nearbyStops, normalizedQuery])

  const flattenedOptions = useMemo(
    () => dropdownSections.flatMap((section) => section.items),
    [dropdownSections]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(value || '')
    }, 0)

    return () => window.clearTimeout(timer)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(event) {
    const nextValue = event.target.value
    setQuery(nextValue)
    onChange?.(nextValue)
    setIsOpen(true)
    setHighlightIndex(-1)
  }

  function handleSelect(stop) {
    setQuery(stop.name)
    onChange?.(stop.name)
    onSelect?.(stop)
    setIsOpen(false)
    setHighlightIndex(-1)
  }

  function handleKeyDown(event) {
    if (!isOpen || flattenedOptions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((previous) => (previous < flattenedOptions.length - 1 ? previous + 1 : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex((previous) => (previous > 0 ? previous - 1 : flattenedOptions.length - 1))
    } else if (event.key === 'Enter' && highlightIndex >= 0) {
      event.preventDefault()
      handleSelect(flattenedOptions[highlightIndex])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  let optionIndex = -1

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
      />

      {isOpen && (
        <div className="autocomplete-dropdown" role="listbox">
          {dropdownSections.length > 0 ? (
            dropdownSections.map((section) => (
              <div key={section.label} className="autocomplete-section">
                <div className="autocomplete-section__label">{section.label}</div>
                <ul className="autocomplete-section__list">
                  {section.items.map((stop) => {
                    optionIndex += 1
                    const isActive = optionIndex === highlightIndex

                    return (
                      <li
                        key={stop.id}
                        role="option"
                        aria-selected={isActive}
                        className={`autocomplete-item ${isActive ? 'autocomplete-item--active' : ''}`}
                        onClick={() => handleSelect(stop)}
                        onMouseEnter={() => setHighlightIndex(optionIndex)}
                      >
                        <span className="autocomplete-item-icon" aria-hidden="true" />
                        <div className="autocomplete-item-content">
                          <span className="autocomplete-item-name">{stop.name}</span>
                          {stop.route_names?.length > 0 && (
                            <div className="autocomplete-item-routes">
                              {stop.route_names.slice(0, 4).map((route) => (
                                <span
                                  key={route}
                                  className="route-badge route-badge--tiny"
                                  style={getRouteBadgeStyle(route, routeStyleMap)}
                                >
                                  {route}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          ) : (
            <div className="autocomplete-empty">No stops match that search yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
