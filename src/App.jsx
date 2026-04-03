import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import Signup from './pages/Signup'
import RouteCard from './components/RouteCard'
import Navbar from './components/Navbar'
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


  const [view, setView] = useState("find")
  const [searchQuery, setSearchQuery] = useState("")

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
    if (error) return { error: error.message }
    return { error: null }
  }

  async function handleSignup(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function logout() {
    setLogoutLoading(true)
    const { error } = await supabase.auth.signOut()

    if (error) setMsg('Logout failed: ' + error.message)

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
      user_id: session.user.id,
      origin,
      destination
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

  // FILTERED ROUTES (SEARCH)
  const filteredRoutes = routes.filter(r =>
    r.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // AUTH SCREENS
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

  // MAIN APP
  return (
    <>
      {/* NAVBAR */}
      <Navbar
        currentView={view}
        onViewChange={setView}
        onSearch={setSearchQuery}
        onLogout={() => setShowLogoutConfirm(true)}
      />

      <div className="container">

        {/* LOGOUT MODAL */}
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

                <button onClick={logout} disabled={logoutLoading}>
                  {logoutLoading ? 'Logging out...' : 'Log Out'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FIND VIEW */}
        {view === "find" && (
          <>
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
          </>
        )}

        <hr />

        {/* SAVED VIEW */}
        {view === "saved" && (
          <>
            <h2>Saved Routes</h2>

            {filteredRoutes.length === 0 && <p>No saved routes yet.</p>}

            {filteredRoutes.map(r => (
              <RouteCard
                key={r.id}
                route={r}
                onDelete={deleteRoute}
              />
            ))}
          </>
        )}

      </div>
    </>
  )
}

export default App