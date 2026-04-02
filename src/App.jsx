import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Signup from './Signup'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [authScreen, setAuthScreen] = useState('login')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [routes, setRoutes] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const sessionRef = useRef(null)

  async function loadRoutes(sessionData) {
    if (!sessionData) return
    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('user_id', sessionData.user.id)
      .order('created_at', { ascending: false })
    if (!error) setRoutes(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      sessionRef.current = session
      loadRoutes(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      sessionRef.current = session
      loadRoutes(session)
    })
  }, [])

  async function handleLogin(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  }

  async function handleSignup(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  }

  async function logout() {
    setLogoutLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setMsg('Logout failed: ' + error.message)
    }
    setShowLogoutConfirm(false)
    setLogoutLoading(false)
  }

  async function saveRoute() {
    if (!origin || !destination) {
      setMsg('Fill in both fields.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('saved_routes').insert({
      user_id: session.user.id, origin, destination
    })
    if (error) {
      setMsg('DB error: ' + error.message)
    } else {
      setOrigin('')
      setDestination('')
      setMsg('Route saved!')
      await loadRoutes(session)
    }
    setLoading(false)
  }

  async function deleteRoute(id) {
    await supabase.from('saved_routes').delete().eq('id', id)
    await loadRoutes(session)
  }

  // Auth screens
  if (!session) {
    return (
      <>
        {authScreen === 'login' && (
          <Login onSwitch={setAuthScreen} onLogin={handleLogin} />
        )}
        {authScreen === 'signup' && (
          <Signup onSwitch={setAuthScreen} onSignup={handleSignup} />
        )}
      </>
    )
  }

  // Main app screen
  return (
    <div className="container">
      <header>
        UGA Transit
        <button
          className="secondary small"
          onClick={() => setShowLogoutConfirm(true)}
          disabled={logoutLoading}
          title="Log Out"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </header>

      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Log Out?</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button
                className="secondary"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={logoutLoading}
              >
                Cancel
              </button>
              <button
                onClick={logout}
                disabled={logoutLoading}
              >
                {logoutLoading ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h2>Search a Route</h2>
      <input
        placeholder="From"
        value={origin}
        onChange={e => setOrigin(e.target.value)}
      />
      <input
        placeholder="To"
        value={destination}
        onChange={e => setDestination(e.target.value)}
      />
      <button onClick={saveRoute} disabled={loading}>
        {loading ? 'Saving...' : 'Save Route'}
      </button>
      {msg && <p className="msg">{msg}</p>}
      <hr />
      <h2>Saved Routes</h2>
      {routes.length === 0 && <p>No saved routes yet.</p>}
      {routes.map(r => (
        <div className="card" key={r.id}>
          <span>{r.origin} → {r.destination}</span>
          <button className="secondary small" onClick={() => deleteRoute(r.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}

export default App
