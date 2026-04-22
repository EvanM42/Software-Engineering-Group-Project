import { getRouteBadgeStyle } from '../utils/routeStyles'

export default function StopCard({ stop, onSelect, distance, compact, routeStyleMap }) {
  const routes = stop.route_names || []

  return (
    <div
      className={`stop-card ${compact ? 'stop-card--compact' : ''}`}
      onClick={() => onSelect?.(stop)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.(stop)
        }
      }}
    >
      <div className="stop-card-info">
        <div className="stop-card-name">
          <span className="stop-card-icon" aria-hidden="true">📍</span>
          {stop.name}
        </div>

        {distance != null && (
          <span className="stop-card-distance">
            {distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`}
          </span>
        )}

        {routes.length > 0 && (
          <div className="stop-card-routes">
            {routes.map((route) => (
              <span
                key={route}
                className="route-badge"
                style={getRouteBadgeStyle(route, routeStyleMap)}
              >
                {route}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
