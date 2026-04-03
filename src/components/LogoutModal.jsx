export default function LogoutModal({ isOpen, onClose, onConfirm, loading }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Log Out?</h3>
        <p>Are you sure you want to log out?</p>

        <div className="modal-actions">
          <button
            className="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button onClick={onConfirm} disabled={loading}>
            {loading ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  )
}
