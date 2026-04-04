export default function RouteCard({ route, onDelete }) {
  return (
    <div className="card">
      <span>
        {route.origin} → {route.destination}
      </span>

      <button
        className="secondary small"
        onClick={() => onDelete(route.id)}
      >
        Delete
      </button>
    </div>
  );
}