import { useNavigate } from 'react-router-dom'

export default function Navbar({ onViewChange, currentView, onLogout, onHomeClick }) {
  const navigate = useNavigate()

  function handleHomeClick() {
    onHomeClick?.()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="nav-left">
        <button className="nav-brand" onClick={handleHomeClick}>
          UGA Transit
        </button>
      </div>

      <div className="nav-right">
        <button
          className={currentView === 'stops' ? 'active' : ''}
          onClick={() => onViewChange('stops')}
        >
          Stops
        </button>

        <button
          className={currentView === 'saved' ? 'active' : ''}
          onClick={() => onViewChange('saved')}
        >
          Saved
        </button>

        <button onClick={onLogout}>Logout</button>
      </div>
    </nav>
  )
}
