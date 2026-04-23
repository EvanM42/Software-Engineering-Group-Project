import { useState, useEffect } from 'react'
import { getDirections } from '../services/directionsService'

export default function RouteCard({ 
  route, 
  onDelete, 
  onSelect,
  activeNotifications,
  notificationLeads,
  onToggleNotification,
  onLeadChange,
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isExpanded && trips.length === 0) {
      fetchTrips()
    }
  }, [isExpanded])

  async function fetchTrips() {
    setLoading(true)
    setError(null)
    try {
      const context = ', Athens, GA'
      const results = await getDirections(
        route.origin.includes('Athens') ? route.origin : route.origin + context,
        route.destination.includes('Athens') ? route.destination : route.destination + context,
        'transit'
      )
      
      const transitTrips = results.filter(trip => 
        trip.steps.some(s => s.travelMode === 'TRANSIT' && s.transit)
      )

      setTrips(transitTrips.slice(0, 5)) // Increased to 5
      if (transitTrips.length === 0 && results.length > 0) {
        setError('Only walking/driving routes found for this time.')
      } else if (results.length === 0) {
        setError('No upcoming trips found.')
      }
    } catch (err) {
      console.error('Failed to fetch trips for saved route:', err)
      setError('Could not fetch latest times.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <article
      className={`card route-card ${isExpanded ? 'is-expanded' : 'card--interactive'}`}
      onClick={() => {
        if (!isExpanded) onSelect?.(route)
      }}
    >
      <div className="route-card__main" onClick={(e) => isExpanded && e.stopPropagation()}>
        <div className="route-card__body">
          <span className="route-card__eyebrow">Saved route</span>
          <div className="route-card__title-group">
            <h3 className="card-title">
              {route.origin}
            </h3>
            <span className="route-card__arrow">↓</span>
            <h3 className="card-title">
              {route.destination}
            </h3>
          </div>
        </div>

        <div className="route-card__actions">
          <button
            className={`trip-toggle-btn ${isExpanded ? 'is-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              if (!isExpanded) setTrips([]) 
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? 'Hide' : 'View Trips'}
          </button>
          <button
            className="delete-btn"
            title="Delete Route"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(route.id)
            }}
          >
            ×
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="route-card__trips" onClick={(e) => e.stopPropagation()}>
          <div className="trips-header">
            <h4>Next Upcoming Trips</h4>
            {loading && <span className="loader-dots">Loading...</span>}
          </div>

          {error ? (
            <p className="trips-empty">{error}</p>
          ) : trips.length > 0 ? (
            <div className="trips-list">
              {trips.map((trip, tripIdx) => {
                const firstTransit = trip.steps.find(s => s.travelMode === 'TRANSIT' && s.transit)
                if (!firstTransit) return null
                
                const tripId = `saved-${route.id}-trip-${tripIdx}`
                const isNotifying = activeNotifications[tripId]

                return (
                  <div key={tripId} className="mini-trip">
                    <div className="mini-trip__top">
                      <div className="mini-trip__times">
                        <div className="time-block">
                          <span className="time-label">Board</span>
                          <strong>{firstTransit.transit.departureTime}</strong>
                        </div>
                        <span className="time-separator">→</span>
                        <div className="time-block">
                          <span className="time-label">Arrive</span>
                          <strong>{firstTransit.transit.arrivalTime}</strong>
                        </div>
                      </div>
                      <div className="mini-trip__duration">
                        {trip.duration}
                      </div>
                    </div>

                    <div className="mini-trip__bottom">
                      <div className="mini-trip__info">
                        <span className="mini-trip__line-badge">
                          {firstTransit.transit.lineName}
                        </span>
                        <span className="mini-trip__stops-count">
                          {firstTransit.transit.numStops} stop{firstTransit.transit.numStops === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="mini-trip__notify-zone">
                        {isNotifying ? (
                          <div className="active-alert-pill">
                            <span className="wiggle">🔔</span>
                            <span>{notificationLeads[tripId] || 5}m Alert</span>
                            <button 
                              className="cancel-alert-btn"
                              onClick={() => onToggleNotification(firstTransit, tripId)}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="notify-setup">
                            <select
                              className="mini-trip__select"
                              value={notificationLeads[tripId] || 5}
                              onChange={(e) => onLeadChange(tripId, Number(e.target.value))}
                            >
                              <option value={5}>5m</option>
                              <option value={10}>10m</option>
                              <option value={15}>15m</option>
                            </select>
                            <button
                              className="mini-notify-btn"
                              onClick={() => onToggleNotification(firstTransit, tripId)}
                            >
                              Set Alert
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : !loading && (
            <p className="trips-empty">No more buses scheduled for today.</p>
          )}
        </div>
      )}
    </article>
  )
}
