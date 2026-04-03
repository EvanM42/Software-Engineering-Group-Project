export default function StopCard({ stop, onSelect, distance, compact }) {
  const routes = stop.route_names || []

  return (
    <div
      className={`stop-card ${compact ? 'stop-card--compact' : ''}`}
      onClick={() => onSelect?.(stop)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(stop)}
    >
      <div className="stop-card-info">
        <div className="stop-card-name">
          <span className="stop-card-icon">📍</span>
          {stop.name}
        </div>

        {distance != null && (
          <span className="stop-card-distance">
            {distance < 1
              ? `${Math.round(distance * 1000)}m away`
              : `${distance.toFixed(1)}km away`}
          </span>
        )}

        {routes.length > 0 && (
          <div className="stop-card-routes">
            {routes.map((route) => (
              <span key={route} className="route-badge">
                {route}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
