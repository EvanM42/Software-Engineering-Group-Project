export default function RouteCard({ route, onDelete, onSelect }) {
  return (
    <article
      className={`card route-card ${onSelect ? 'card--interactive' : ''}`}
      onClick={() => onSelect?.(route)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.(route)
        }
      }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="route-card__body">
        <span className="route-card__eyebrow">Saved route</span>
        <span className="card-title">
          {route.origin} {'\u2192'} {route.destination}
        </span>
      </div>

      <div className="route-card__actions">
        <button
          className="secondary small"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(route.id)
          }}
        >
          Delete
        </button>
      </div>
    </article>
  )
}
