import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useBusStops, getNearbyStops } from '../hooks/useBusStops'
import Navbar from '../components/Navbar'
import RouteCard from '../components/RouteCard'
import LogoutModal from '../components/LogoutModal'
import BusMap from '../components/BusMap'
import StopAutocomplete from '../components/StopAutocomplete'
import StopCard from '../components/StopCard'

export default function Home() {
  const { session, logout } = useAuth()
  const { stops: busStops, loading: stopsLoading } = useBusStops()

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [selectedOrigin, setSelectedOrigin] = useState(null)
  const [selectedDestination, setSelectedDestination] = useState(null)
  const [routes, setRoutes] = useState([])

  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const [view, setView] = useState('find')
  const [searchQuery, setSearchQuery] = useState('')

  // Nearby stops
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)

  useEffect(() => {
    if (session) loadRoutes()
  }, [session])

  // Request geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setLocationError('Location access denied')
      }
    )
  }, [])

  const nearbyStops = userLocation
    ? getNearbyStops(busStops, userLocation.lat, userLocation.lng, 5)
    : []

  async function loadRoutes() {
    if (!session) return

    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      // Table may not exist yet - fail silently
      if (error.code === 'PGRST116' || error.message?.includes('404')) {
        setRoutes([])
      }
      return
    }

    setRoutes(data || [])
  }

  async function saveRoute() {
    if (!origin || !destination) {
      setMsg('Please select both stops.')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('saved_routes').insert({
      user_id: session.user.id,
      origin,
      destination,
    })

    if (error) {
      setMsg('DB error: ' + error.message)
    } else {
      setOrigin('')
      setDestination('')
      setSelectedOrigin(null)
      setSelectedDestination(null)
      setMsg('Route saved!')
      await loadRoutes()
    }

    setLoading(false)
  }

  async function deleteRoute(id) {
    await supabase.from('saved_routes').delete().eq('id', id)
    await loadRoutes()
  }

  async function handleLogout() {
    setLogoutLoading(true)
    const result = await logout()
    if (result?.error) setMsg('Logout failed: ' + result.error)
    setShowLogoutConfirm(false)
    setLogoutLoading(false)
  }

  function handleStopClick(stop) {
    // If no origin is set, set as origin; otherwise set as destination
    if (!selectedOrigin) {
      setOrigin(stop.name)
      setSelectedOrigin(stop)
    } else if (!selectedDestination) {
      setDestination(stop.name)
      setSelectedDestination(stop)
    }
  }

  const filteredRoutes = routes.filter(
    (r) =>
      r.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destination.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredStops = searchQuery
    ? busStops.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.route_names || []).some((r) =>
            r.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : busStops

  return (
    <>
      <Navbar
        currentView={view}
        onViewChange={setView}
        onSearch={setSearchQuery}
        onLogout={() => setShowLogoutConfirm(true)}
      />

      <LogoutModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
      />

      {/* MAP — always visible */}
      <BusMap
        stops={busStops}
        selectedOrigin={selectedOrigin}
        selectedDestination={selectedDestination}
        onStopClick={view === 'find' ? handleStopClick : undefined}
        userLocation={userLocation}
      />

      {/* BACK NAVIGATION BAR */}
      {view !== 'find' && (
        <div className="sub-nav-bar" onClick={() => setView('find')}>
          <span className="sub-nav-icon">←</span>
          <span>Back to Home</span>
        </div>
      )}

      <div className="container">

        {/* ===== FIND VIEW ===== */}
        {view === 'find' && (
          <>
            <h2>Find a Route</h2>
            <p className="view-hint">Select stops from the map or type below</p>

            <div className="route-inputs">
              <div className="route-input-group">
                <label className="input-label">
                  <span className="input-dot input-dot--origin" />
                  From
                </label>
                <StopAutocomplete
                  id="origin-input"
                  stops={busStops}
                  value={origin}
                  placeholder="Search origin stop..."
                  onChange={(val) => {
                    setOrigin(val)
                    if (!val) setSelectedOrigin(null)
                  }}
                  onSelect={(stop) => {
                    setOrigin(stop.name)
                    setSelectedOrigin(stop)
                  }}
                />
              </div>

              <div className="route-input-group">
                <label className="input-label">
                  <span className="input-dot input-dot--dest" />
                  To
                </label>
                <StopAutocomplete
                  id="dest-input"
                  stops={busStops}
                  value={destination}
                  placeholder="Search destination stop..."
                  onChange={(val) => {
                    setDestination(val)
                    if (!val) setSelectedDestination(null)
                  }}
                  onSelect={(stop) => {
                    setDestination(stop.name)
                    setSelectedDestination(stop)
                  }}
                />
              </div>
            </div>

            <button onClick={saveRoute} disabled={loading}>
              {loading ? 'Finding...' : 'Find Route'}
            </button>

            {msg && <p className="msg">{msg}</p>}

            {/* Nearby Stops */}
            {nearbyStops.length > 0 && (
              <div className="nearby-section">
                <h3>📍 Nearby Stops</h3>
                <div className="stop-list">
                  {nearbyStops.map((stop) => (
                    <StopCard
                      key={stop.id}
                      stop={stop}
                      distance={stop.distance}
                      compact
                      onSelect={handleStopClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== STOPS VIEW ===== */}
        {view === 'stops' && (
          <>
            <h2>Bus Stops</h2>
            <p className="view-hint">
              {stopsLoading
                ? 'Loading stops...'
                : `${filteredStops.length} stop${filteredStops.length !== 1 ? 's' : ''} found`}
            </p>

            <div className="stop-list">
              {filteredStops.map((stop) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  onSelect={(s) => {
                    setSelectedOrigin(s)
                    setView('find')
                    setOrigin(s.name)
                  }}
                />
              ))}
            </div>

            {!stopsLoading && filteredStops.length === 0 && (
              <p className="empty-state">No stops found matching your search.</p>
            )}
          </>
        )}

        {/* ===== SAVED VIEW ===== */}
        {view === 'saved' && (
          <>
            <h2>Saved Routes</h2>

            {filteredRoutes.length === 0 && <p>No saved routes yet.</p>}

            {filteredRoutes.map((r) => (
              <RouteCard key={r.id} route={r} onDelete={deleteRoute} />
            ))}
          </>
        )}
      </div>
    </>
  )
}
