import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useBusStops, getNearbyStops } from '../hooks/useBusStops'
import { useBusRoutes } from '../hooks/useBusRoutes'
import { getTransitAndWalking } from '../services/directionsService'
import { buildMapOverlays } from '../utils/mapRouteUtils'
import { buildRouteStyleMap, getRouteBadgeStyle } from '../utils/routeStyles'
import Navbar from '../components/Navbar'
import RouteCard from '../components/RouteCard'
import LogoutModal from '../components/LogoutModal'
import BusMap from '../components/BusMap'
import StopAutocomplete from '../components/StopAutocomplete'
import StopCard from '../components/StopCard'

export default function Home() {
  // auth, stop, and route data drive the full planner experience
  const { session, logout } = useAuth()
  const { stops: busStops, loading: stopsLoading } = useBusStops()
  const { routes: busRoutes } = useBusRoutes()

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [selectedOrigin, setSelectedOrigin] = useState(null)
  const [selectedDestination, setSelectedDestination] = useState(null)
  const [savedRoutes, setSavedRoutes] = useState([])
  const [tripResults, setTripResults] = useState({ transit: [], walking: [], errors: null })

  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const [view, setView] = useState('find')
  const [searchQuery, setSearchQuery] = useState('')

  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [etaTick, setEtaTick] = useState(() => Date.now())

  useEffect(() => {
    // capture the user's location for nearby stops and map focus
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

  useEffect(() => {
    // refresh eta text on a timer without reloading the map
    const intervalId = window.setInterval(() => {
      setEtaTick(Date.now())
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [])

  const nearbyStops = userLocation
    ? getNearbyStops(busStops, userLocation.lat, userLocation.lng, 5)
    : []

  const routeStyleMap = useMemo(() => buildRouteStyleMap(busRoutes), [busRoutes])

  // prefer uga transit results when google returns multiple transit options
  const preferredTransitRoutes = useMemo(
    () => prioritizeUgaTransitRoutes(tripResults.transit, busRoutes),
    [tripResults.transit, busRoutes]
  )

  const primaryTransitRoute = preferredTransitRoutes[0] || null

  const mapData = useMemo(
    () => buildMapOverlays({
      transitRoutes: primaryTransitRoute ? [primaryTransitRoute] : [],
      walkingRoutes: tripResults.walking.slice(0, 1),
      busRoutes,
      stops: busStops,
    }),
    [primaryTransitRoute, tripResults.walking, busRoutes, busStops]
  )

  const transitStepSummaries = useMemo(() => {
    const route = primaryTransitRoute
    if (!route) return []

    return route.steps
      .filter((step) => step.travelMode === 'TRANSIT' && step.transit)
      .map((step, index) => ({
        id: `${step.transit.lineName || 'transit'}-${index}`,
        lineName: step.transit.lineName || 'Transit',
        duration: step.duration,
        departureStop: step.transit.departureStop,
        departureTime: step.transit.departureTime,
        arrivalStop: step.transit.arrivalStop,
        arrivalTime: step.transit.arrivalTime,
        numStops: step.transit.numStops,
        agencyName: step.transit.agencyName,
        lineStyle: getRouteBadgeStyle(step.transit.lineName, routeStyleMap),
      }))
  }, [primaryTransitRoute, routeStyleMap])

  const selectedStopBoard = useMemo(() => {
    // build the live board from the first departure and final arrival on the selected route
    if (!primaryTransitRoute) return []

    const transitSteps = primaryTransitRoute.steps.filter(
      (step) => step.travelMode === 'TRANSIT' && step.transit
    )

    const board = []

    if (selectedOrigin && transitSteps.length > 0) {
      const departureStep =
        transitSteps.find((step) => stopMatches(step.transit?.departureStop, selectedOrigin.name)) ||
        transitSteps[0]

      if (departureStep?.transit) {
        board.push({
          id: `origin-${selectedOrigin.id}`,
          kind: 'departure',
          stopName: selectedOrigin.name,
          routeName: departureStep.transit.lineName || 'UGA Route',
          routeStyle: getRouteBadgeStyle(departureStep.transit.lineName, routeStyleMap),
          timestamp: departureStep.transit.departureTime,
          relative: formatRelativeMinutes(departureStep.transit.departureTime, etaTick),
          context: 'Departs here',
          detail: 'Next bus to board',
        })
      }
    }

    if (selectedDestination && transitSteps.length > 0) {
      const arrivalStep =
        [...transitSteps].reverse().find((step) => stopMatches(step.transit?.arrivalStop, selectedDestination.name)) ||
        transitSteps[transitSteps.length - 1]

      if (arrivalStep?.transit) {
        board.push({
          id: `destination-${selectedDestination.id}`,
          kind: 'arrival',
          stopName: selectedDestination.name,
          routeName: arrivalStep.transit.lineName || 'UGA Route',
          routeStyle: getRouteBadgeStyle(arrivalStep.transit.lineName, routeStyleMap),
          timestamp: arrivalStep.transit.arrivalTime,
          relative: formatRelativeMinutes(arrivalStep.transit.arrivalTime, etaTick),
          context: 'Arrives here',
          detail: 'Bus reaches this stop',
        })
      }
    }

    return board
  }, [etaTick, primaryTransitRoute, routeStyleMap, selectedOrigin, selectedDestination])

  const transitServiceStatus = useMemo(
    () => getTransitServiceStatus(primaryTransitRoute, tripResults.walking, etaTick),
    [etaTick, primaryTransitRoute, tripResults.walking]
  )

  const liveBuses = useMemo(() => [], [])

  const loadSavedRoutes = useCallback(async () => {
    if (!session) return

    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('404')) {
        setSavedRoutes([])
      }
      return
    }

    setSavedRoutes(data || [])
  }, [session])

  useEffect(() => {
    if (session) loadSavedRoutes()
  }, [session, loadSavedRoutes])

  const runRouteSearch = useCallback(async (originStop, destinationStop) => {
    setLoading(true)
    setMsg('')

    try {
      const originParam = `${originStop.lat},${originStop.lng}`
      const destinationParam = `${destinationStop.lat},${destinationStop.lng}`
      console.info('[route] requesting directions', {
        from: { name: originStop.name, lat: originStop.lat, lng: originStop.lng },
        to: { name: destinationStop.name, lat: destinationStop.lat, lng: destinationStop.lng },
        sdkLoaded: Boolean(window.google?.maps?.DirectionsService),
      })

      const results = await getTransitAndWalking(originParam, destinationParam)
      const prioritizedTransit = prioritizeUgaTransitRoutes(results.transit, busRoutes)

      console.info('[route] directions result', {
        transitCount: results.transit.length,
        walkingCount: results.walking.length,
        errors: results.errors,
      })

      setTripResults({
        ...results,
        transit: prioritizedTransit,
      })

      if (!prioritizedTransit.length && !results.walking.length) {
        const fallback = buildNoRouteMessage(results.errors)
        console.warn('[route] no routes returned', { errors: results.errors, message: fallback })
        setMsg(fallback)
      } else if (results.errors?.transit && results.walking.length) {
        setMsg(`Walking route found. ${describeTransitError(results.errors.transit)}`)
      } else if (results.errors?.walking && results.transit.length) {
        setMsg('Transit route found. Walking fallback is unavailable right now.')
      } else if (prioritizedTransit.length) {
        setMsg('UGA bus route loaded on the map.')
      } else {
        setMsg('')
      }
    } catch (error) {
      console.error('[route] unhandled error', error)
      setTripResults({ transit: [], walking: [], errors: null })
      setMsg(error.message || 'Unable to find a route right now.')
    } finally {
      setLoading(false)
    }
  }, [busRoutes])

  async function findRoute() {
    if (!selectedOrigin || !selectedDestination) {
      setMsg('Please select both stops.')
      return
    }

    await runRouteSearch(selectedOrigin, selectedDestination)
  }

  async function saveCurrentRoute() {
    if (!session || !origin || !destination) {
      setMsg('Please select both stops before saving.')
      return
    }

    const { error } = await supabase.from('saved_routes').insert({
      user_id: session.user.id,
      origin,
      destination,
    })

    if (error) {
      setMsg(`DB error: ${error.message}`)
      return
    }

    setMsg('Route saved!')
    await loadSavedRoutes()
  }

  async function deleteRoute(id) {
    await supabase.from('saved_routes').delete().eq('id', id)
    await loadSavedRoutes()
  }

  async function handleSavedRouteSelect(savedRoute) {
    const matchedOrigin = findStopByName(busStops, savedRoute.origin)
    const matchedDestination = findStopByName(busStops, savedRoute.destination)

    setOrigin(savedRoute.origin)
    setDestination(savedRoute.destination)
    setSelectedOrigin(matchedOrigin)
    setSelectedDestination(matchedDestination)
    setView('find')

    if (!matchedOrigin || !matchedDestination) {
      setTripResults({ transit: [], walking: [], errors: null })
      setMsg('Saved route loaded, but one of the stops could not be matched to the current stop list.')
      return
    }

    await runRouteSearch(matchedOrigin, matchedDestination)
  }

  async function handleLogout() {
    setLogoutLoading(true)
    const result = await logout()
    if (result?.error) setMsg(`Logout failed: ${result.error}`)
    setShowLogoutConfirm(false)
    setLogoutLoading(false)
  }

  function clearSelections() {
    setOrigin('')
    setDestination('')
    setSelectedOrigin(null)
    setSelectedDestination(null)
    setTripResults({ transit: [], walking: [], errors: null })
    setMsg('')
  }

  function clearOrigin() {
    setOrigin('')
    setSelectedOrigin(null)
    setTripResults({ transit: [], walking: [], errors: null })
    setMsg('')
  }

  function clearDestination() {
    setDestination('')
    setSelectedDestination(null)
    setTripResults({ transit: [], walking: [], errors: null })
    setMsg('')
  }

  function handleStopClick(stop) {
    if (selectedOrigin?.id === stop.id) {
      clearOrigin()
      return
    }

    if (selectedDestination?.id === stop.id) {
      clearDestination()
      return
    }

    if (!selectedOrigin) {
      setOrigin(stop.name)
      setSelectedOrigin(stop)
      return
    }

    if (!selectedDestination) {
      setDestination(stop.name)
      setSelectedDestination(stop)
      return
    }

    setOrigin(stop.name)
    setDestination('')
    setSelectedOrigin(stop)
    setSelectedDestination(null)
    setTripResults({ transit: [], walking: [], errors: null })
    setMsg('')
  }

  const filteredSavedRoutes = savedRoutes.filter(
    (route) =>
      route.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.destination.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredStops = searchQuery
    ? busStops.filter(
        (stop) =>
          stop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (stop.route_names || []).some((route) =>
            route.toLowerCase().includes(searchQuery.toLowerCase())
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
        onHomeClick={() => setView('find')}
      />

      <LogoutModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        loading={logoutLoading}
      />

      <BusMap
        stops={busStops}
        routeStyleMap={routeStyleMap}
        selectedOrigin={selectedOrigin}
        selectedDestination={selectedDestination}
        onStopClick={view === 'find' ? handleStopClick : undefined}
        onClearSelections={clearSelections}
        userLocation={userLocation}
        routeOverlays={mapData.overlays}
        liveBuses={liveBuses}
      />

      {view !== 'find' && (
        <div className="sub-nav-bar" onClick={() => setView('find')}>
          <span className="sub-nav-icon" aria-hidden="true">{'\u2190'}</span>
          <span>Back to Home</span>
        </div>
      )}

      <div className="container">
        {view === 'find' && (
          <div className="planner-shell">
            <section className="planner-panel">
              <div className="planner-card">
                <div className="planner-card__header">
                  <div>
                    <h2>Find a Route</h2>
                    <p className="view-hint">Tap stops on the map or search below. Tap a selected stop again to remove it.</p>
                  </div>
                  {(selectedOrigin || selectedDestination) && (
                    <button type="button" className="ghost-button" onClick={clearSelections}>
                      Clear all
                    </button>
                  )}
                </div>

                <div className="selection-summary">
                  <div className={`selection-chip ${selectedOrigin ? 'is-filled is-origin' : ''}`}>
                    <div className="selection-chip__top">
                      <span className="selection-chip__label">From</span>
                      {selectedOrigin && (
                        <button
                          type="button"
                          className="selection-chip__clear"
                          onClick={clearOrigin}
                          aria-label="Clear origin stop"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <strong>{selectedOrigin?.name || 'Choose a stop'}</strong>
                  </div>
                  <div className={`selection-chip ${selectedDestination ? 'is-filled is-destination' : ''}`}>
                    <div className="selection-chip__top">
                      <span className="selection-chip__label">To</span>
                      {selectedDestination && (
                        <button
                          type="button"
                          className="selection-chip__clear"
                          onClick={clearDestination}
                          aria-label="Clear destination stop"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <strong>{selectedDestination?.name || 'Choose a destination'}</strong>
                  </div>
                </div>

                <div className="route-inputs">
                  <div className="route-input-group">
                    <label className="input-label">
                      <span className="input-dot input-dot--origin" />
                      From
                    </label>
                    <StopAutocomplete
                      id="origin-input"
                      stops={busStops}
                      nearbyStops={nearbyStops}
                      routeStyleMap={routeStyleMap}
                      value={origin}
                      placeholder="Search origin stop..."
                      onChange={(val) => {
                        setOrigin(val)
                        if (!val) {
                          setSelectedOrigin(null)
                          setTripResults({ transit: [], walking: [], errors: null })
                        }
                      }}
                      onSelect={(stop) => {
                        setOrigin(stop.name)
                        setSelectedOrigin(stop)
                        setTripResults({ transit: [], walking: [], errors: null })
                        setMsg('')
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
                      nearbyStops={nearbyStops}
                      routeStyleMap={routeStyleMap}
                      value={destination}
                      placeholder="Search destination stop..."
                      onChange={(val) => {
                        setDestination(val)
                        if (!val) {
                          setSelectedDestination(null)
                          setTripResults({ transit: [], walking: [], errors: null })
                        }
                      }}
                      onSelect={(stop) => {
                        setDestination(stop.name)
                        setSelectedDestination(stop)
                        setTripResults({ transit: [], walking: [], errors: null })
                        setMsg('')
                      }}
                    />
                  </div>
                </div>

                <div className="action-row">
                  <button onClick={findRoute} disabled={loading}>
                    {loading ? 'Finding...' : 'Find Route'}
                  </button>
                  {session && (
                    <button
                      className="secondary"
                      onClick={saveCurrentRoute}
                      disabled={!origin || !destination}
                    >
                      Save Route
                    </button>
                  )}
                </div>

                {msg && <p className="msg">{msg}</p>}
              </div>
            </section>

            <section className="support-panel">
              <div className="live-status-card">
                <div className="live-status-card__main">
                  <div className="live-status-card__header">
                    <div>
                      <h3>Selected Stops Live Board</h3>
                    </div>
                    <span className="live-status-time">
                      {transitServiceStatus?.title || (selectedStopBoard.length ? 'Next scheduled buses' : 'Waiting for a search')}
                    </span>
                  </div>

                  {transitServiceStatus?.message && (
                    <div className={`service-banner service-banner--${transitServiceStatus.tone}`}>
                      <strong>{transitServiceStatus.title}</strong>
                      <span>{transitServiceStatus.message}</span>
                    </div>
                  )}

                  <div className="live-status-metrics">
                    <div className="live-metric">
                      <span className="live-metric__label">Next bus</span>
                      <strong>{selectedStopBoard[0]?.relative || 'No ETA yet'}</strong>
                      <small>{selectedStopBoard[0]?.routeName || 'Search two stops to see the next UGA bus'}</small>
                    </div>
                    <div className="live-metric">
                      <span className="live-metric__label">Scheduled time</span>
                      <strong>{selectedStopBoard[0]?.timestamp || 'No time yet'}</strong>
                      <small>{selectedStopBoard[0]?.stopName || 'Selected stop arrivals appear here'}</small>
                    </div>
                  </div>

                  <div className="stop-board-list">
                    {selectedStopBoard.length > 0 ? (
                      selectedStopBoard.map((item) => (
                        <article key={item.id} className={`stop-board-card stop-board-card--${item.kind}`}>
                          <div className="stop-board-card__top">
                            <div className="stop-board-card__content">
                              <span className="stop-board-card__eyebrow">{item.context}</span>
                              <h4>{item.stopName}</h4>
                              <p className="stop-board-card__detail">{item.detail}</p>
                            </div>
                            <div className="stop-board-card__eta">
                              <strong>{item.relative}</strong>
                              <span>{item.timestamp || 'Scheduled'}</span>
                            </div>
                          </div>
                          <div className="stop-board-card__footer">
                            <span className="route-badge route-badge--outlined" style={item.routeStyle}>
                              {item.routeName}
                            </span>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="schedule-empty">
                        <p>No selected stop arrivals yet.</p>
                        <span>Choose two stops and run a route search to see the next scheduled UGA buses at each stop.</span>
                      </div>
                    )}
                  </div>

                  <div className="schedule-list">
                    {transitStepSummaries.length > 0 ? (
                      transitStepSummaries.slice(0, 3).map((step) => (
                        <article key={step.id} className="schedule-item">
                          <div className="schedule-item__top">
                            <span className="schedule-line-badge" style={step.lineStyle}>{step.lineName}</span>
                            <span className="schedule-duration">{step.duration}</span>
                          </div>
                          <div className="schedule-item__times">
                            <div>
                              <span className="schedule-label">Board</span>
                              <strong>{step.departureTime || 'Scheduled'}</strong>
                              <p>{step.departureStop}</p>
                            </div>
                            <div>
                              <span className="schedule-label">Arrive</span>
                              <strong>{step.arrivalTime || 'Scheduled'}</strong>
                              <p>{step.arrivalStop}</p>
                            </div>
                          </div>
                          <p className="schedule-meta">
                            {step.numStops} stop{step.numStops === 1 ? '' : 's'}
                            {step.agencyName ? ` via ${step.agencyName}` : ''}
                          </p>
                        </article>
                      ))
                    ) : (
                      <div className="schedule-empty">
                        <p>No transit legs yet.</p>
                        <span>Run a route search and the next bus details will appear here.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {locationError && <p className="view-hint">{locationError}</p>}
            </section>

            <section className="results-panel">
              {transitServiceStatus?.tone === 'warning' && (
                <div className="results-section results-section--notice">
                  <div className="service-banner service-banner--warning">
                    <strong>{transitServiceStatus.title}</strong>
                    <span>{transitServiceStatus.message}</span>
                  </div>
                </div>
              )}

              {primaryTransitRoute && (
                <div className="results-section">
                  <h3>UGA Bus Route</h3>
                  {[primaryTransitRoute].map((route, index) => (
                    <article key={`transit-${index}`} className="trip-card trip-card--transit">
                      <div className="trip-card-header">
                        <div className="trip-card-header__title">
                          <span className="trip-card-kicker">Take this bus</span>
                          <div className="trip-card-line">
                            <span
                              className="route-badge route-badge--outlined route-badge--hero"
                              style={getRouteBadgeStyle(transitStepSummaries[0]?.lineName, routeStyleMap)}
                            >
                              {transitStepSummaries[0]?.lineName || 'UGA Route'}
                            </span>
                            <strong>{route.summary || 'Transit option'}</strong>
                          </div>
                        </div>
                        <span className="trip-card-total">{route.duration}</span>
                      </div>
                      <p>{route.distance}</p>
                      <div className="trip-step-list">
                        {route.steps.map((step, stepIndex) => (
                          <div key={`transit-step-${stepIndex}`} className="trip-step">
                           <span
                             className={`trip-step-dot ${step.travelMode === 'TRANSIT' ? 'is-transit' : 'is-walk'}`}
                           />
                           <div className="trip-step-content">
                              <div className="trip-step-title">
                                {step.travelMode === 'TRANSIT'
                                  ? `${step.transit?.lineName || 'Transit'} bus - ${step.duration}`
                                  : `Walk - ${step.duration}`}
                              </div>
                              {step.transit ? (
                                <div className="trip-step-detail-block">
                                  <span className="route-badge route-badge--outlined" style={getRouteBadgeStyle(step.transit.lineName, routeStyleMap)}>
                                    {step.transit.lineName || 'UGA Route'}
                                  </span>
                                  <p>
                                    <strong>Board:</strong> {step.transit.departureStop} at {step.transit.departureTime || 'scheduled'}
                                  </p>
                                  <p>
                                    <strong>Arrive:</strong> {step.transit.arrivalStop} at {step.transit.arrivalTime || 'scheduled'}
                                  </p>
                                  <p>
                                    {step.transit.numStops} stop{step.transit.numStops === 1 ? '' : 's'}
                                    {step.transit.agencyName ? ` via ${step.transit.agencyName}` : ''}
                                  </p>
                                </div>
                              ) : (
                                <p>{step.distance}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {tripResults.walking.length > 0 && (
                <div className="results-section">
                  <h3>Walking Option</h3>
                  {tripResults.walking.slice(0, 1).map((route, index) => (
                    <article key={`walking-${index}`} className="trip-card trip-card--walking">
                      <div className="trip-card-header">
                        <strong>{route.summary || 'Walking option'}</strong>
                        <span>{route.duration}</span>
                      </div>
                      <p>{route.distance}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {view === 'stops' && (
          <>
            <h2>Bus Stops</h2>
            <p className="view-hint">
              {stopsLoading
                ? 'Loading stops...'
                : `${filteredStops.length} stop${filteredStops.length !== 1 ? 's' : ''} found`}
            </p>

            <div className={`stops-columns${nearbyStops.length > 0 && !searchQuery ? ' stops-columns--split' : ''}`}>
              {nearbyStops.length > 0 && !searchQuery && (
                <section className="stops-section nearby-section">
                  <div className="stops-section__header">
                    <h3>Nearby Stops</h3>
                    <p>Closest stops to your current location.</p>
                  </div>

                  <div className="stop-list">
                    {nearbyStops.map((stop) => (
                      <StopCard
                        key={stop.id}
                        stop={stop}
                        routeStyleMap={routeStyleMap}
                        distance={stop.distance}
                        compact
                        onSelect={(selectedStop) => {
                          setSelectedOrigin(selectedStop)
                          setOrigin(selectedStop.name)
                          setView('find')
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section className="stops-section">
                <div className="stops-section__header">
                  <h3>All Stops</h3>
                  <p>Full UGA bus stop list.</p>
                </div>

                <div className="stop-list">
                  {filteredStops.map((stop) => (
                    <StopCard
                      key={stop.id}
                      stop={stop}
                      routeStyleMap={routeStyleMap}
                      onSelect={(selectedStop) => {
                        setSelectedOrigin(selectedStop)
                        setOrigin(selectedStop.name)
                        setView('find')
                      }}
                    />
                  ))}
                </div>
              </section>
            </div>

            {!stopsLoading && filteredStops.length === 0 && (
              <p className="empty-state">No stops found matching your search.</p>
            )}
          </>
        )}

        {view === 'saved' && (
          <>
            <h2>Saved Routes</h2>

            {filteredSavedRoutes.length === 0 && (
              <div className="saved-empty">
                <h3>No saved routes yet</h3>
                <p>Save a UGA bus route from the planner and it will show up here for one-tap reuse.</p>
              </div>
            )}

            <div className="saved-routes-list">
              {filteredSavedRoutes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onDelete={deleteRoute}
                  onSelect={handleSavedRouteSelect}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function findStopByName(stops, targetName) {
  const normalizedTarget = normalizeText(targetName)

  return stops.find((stop) => normalizeText(stop.name) === normalizedTarget) ||
    stops.find((stop) => normalizeText(stop.name).includes(normalizedTarget) || normalizedTarget.includes(normalizeText(stop.name))) ||
    null
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function prioritizeUgaTransitRoutes(routes, busRoutes) {
  if (!routes?.length) return []

  return [...routes].sort((left, right) => {
    const scoreDiff = getUgaTransitScore(right, busRoutes) - getUgaTransitScore(left, busRoutes)
    if (scoreDiff !== 0) return scoreDiff

    return getDurationMinutes(left.duration) - getDurationMinutes(right.duration)
  })
}

function getUgaTransitScore(route, busRoutes) {
  return route.steps.reduce((score, step) => {
    if (step.travelMode !== 'TRANSIT' || !step.transit) return score

    const agencyName = normalizeText(step.transit.agencyName)
    const lineName = normalizeText(step.transit.lineName)
    const matchesKnownRoute = busRoutes.some((routeOption) => {
      const routeName = normalizeText(routeOption.name)
      const shortName = normalizeText(routeOption.shortName)
      return routeName === lineName || shortName === lineName
    })

    if (agencyName.includes('uga') || agencyName.includes('campus transit')) return score + 4
    if (matchesKnownRoute) return score + 3
    return score
  }, 0)
}

function buildNoRouteMessage(errors) {
  const transitStatus = errors?.transit?.status
  const walkingStatus = errors?.walking?.status

  if (transitStatus === 'ZERO_RESULTS' && walkingStatus === 'ZERO_RESULTS') {
    return 'Google could not find any route between those stops right now. Transit may be outside service hours — try again during operating times.'
  }
  if (transitStatus === 'ZERO_RESULTS') {
    return 'No transit route is available right now (likely outside UGA bus service hours).'
  }
  if (transitStatus === 'REQUEST_DENIED' || walkingStatus === 'REQUEST_DENIED') {
    return 'Google rejected the directions request. Check that the Maps API key has Directions enabled.'
  }
  if (errors?.transit?.message || errors?.walking?.message) {
    return `Google Maps error: ${errors?.transit?.message || errors?.walking?.message}`
  }
  return 'No Google Maps route options were returned for those stops.'
}

function describeTransitError(transitError) {
  if (transitError?.status === 'ZERO_RESULTS') {
    return 'No transit option right now — try again during UGA bus service hours.'
  }
  return 'Google transit directions are unavailable right now.'
}

function getDurationMinutes(durationText) {
  const normalized = String(durationText || '').toLowerCase()
  const hours = normalized.match(/(\d+)\s*hour/)?.[1]
  const minutes = normalized.match(/(\d+)\s*min/)?.[1]

  return (hours ? Number(hours) * 60 : 0) + (minutes ? Number(minutes) : 0)
}

function stopMatches(stopName, targetStopName) {
  return normalizeText(stopName) === normalizeText(targetStopName)
}

function formatRelativeMinutes(displayTime, nowValue = Date.now()) {
  const scheduledDate = parseDisplayTime(displayTime, nowValue)
  if (!scheduledDate) return 'Scheduled'

  const diffMinutes = Math.round((scheduledDate.getTime() - nowValue) / 60000)
  if (diffMinutes <= 0) return 'Due now'
  if (diffMinutes === 1) return '1 min'
  if (diffMinutes < 60) return `${diffMinutes} mins`

  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (minutes === 0) {
    return hours === 1 ? '1 hr' : `${hours} hrs`
  }

  const hourLabel = hours === 1 ? '1 hr' : `${hours} hrs`
  const minuteLabel = minutes === 1 ? '1 min' : `${minutes} mins`
  return `${hourLabel} ${minuteLabel}`
}

function parseDisplayTime(displayTime, nowValue = Date.now()) {
  const normalized = String(displayTime || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
  const match = normalized.match(/^(\d{1,2}):(\d{2})(AM|PM)$/)
  if (!match) return null

  const [, rawHours, rawMinutes, meridiem] = match
  let hours = Number(rawHours)
  const minutes = Number(rawMinutes)

  if (meridiem === 'PM' && hours !== 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0

  const now = new Date(nowValue)
  const scheduled = new Date(now)
  scheduled.setHours(hours, minutes, 0, 0)

  if (scheduled.getTime() < now.getTime() - 60000) {
    scheduled.setDate(scheduled.getDate() + 1)
  }

  return scheduled
}

function getTransitServiceStatus(primaryTransitRoute, walkingRoutes, nowValue) {
  if (!primaryTransitRoute) {
    if (walkingRoutes?.length) {
      return {
        tone: 'warning',
        title: 'UGA buses are out of service',
        message: 'No scheduled UGA bus service is available right now for this trip. Walking is the only current option.',
      }
    }

    return null
  }

  const firstTransitStep = primaryTransitRoute.steps.find(
    (step) => step.travelMode === 'TRANSIT' && step.transit
  )
  const nextDeparture = parseDisplayTime(firstTransitStep?.transit?.departureTime, nowValue)

  if (!nextDeparture) return null

  const diffMinutes = Math.round((nextDeparture.getTime() - nowValue) / 60000)
  if (diffMinutes >= 180) {
    const routeName = firstTransitStep?.transit?.lineName || 'This route'

    return {
      tone: 'warning',
      title: `${routeName} is out of service now`,
      message: `The next scheduled bus is at ${firstTransitStep.transit.departureTime}. Service appears to resume later rather than in the next few minutes.`,
    }
  }

  return {
    tone: 'active',
    title: 'Next scheduled buses',
    message: '',
  }
}
