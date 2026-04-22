import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { GoogleMap, useJsApiLoader, InfoWindow, Polyline } from '@react-google-maps/api'
import { getRouteBadgeStyle } from '../utils/routeStyles'

// keep the default map centered on uga when no route is active
const UGA_CENTER = { lat: 33.9519, lng: -83.3763 }

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0',
}

const mapStyles = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e7f5' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#f0ede8' }] },
  { featureType: 'landscape.natural', elementType: 'geometry.fill', stylers: [{ color: '#e8f0e4' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#ffd480' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e6b84d' }] },
  { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.local', elementType: 'geometry.fill', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
]

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  fullscreenControl: true,
  mapId: 'uga_transit_map',
  styles: mapStyles,
  gestureHandling: 'greedy',
  scrollwheel: true,
}

// selected stops get stronger marker colors than the rest of the stop list
function getMarkerColor(stop, selectedOrigin, selectedDestination) {
  if (selectedOrigin?.id === stop.id) return '#22c55e'
  if (selectedDestination?.id === stop.id) return '#ef4444'
  return '#BA0C2F'
}

// selected stops use a larger marker size so they stand out on the map
function getMarkerSize(stop, selectedOrigin, selectedDestination) {
  if (selectedOrigin?.id === stop.id || selectedDestination?.id === stop.id) return 14
  return 9
}

function BusMap({
  stops,
  selectedOrigin,
  selectedDestination,
  onStopClick,
  onClearSelections,
  userLocation,
  routeOverlays = [],
  liveBuses = [],
  routeStyleMap = {},
}) {
  // local map state keeps info windows and marker refs stable between eta refreshes
  const [activeMarker, setActiveMarker] = useState(null)
  const [map, setMap] = useState(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const liveBusMarkersRef = useRef([])
  const previousOverlayKeyRef = useRef('')

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['marker'],
  })

  // attach the google map instance once it is ready
  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance)
  }, [])

  useEffect(() => {
    // render stop markers without rebuilding the whole map
    if (!map || !isLoaded || !stops.length) return

    markersRef.current.forEach(clearMarker)
    markersRef.current = []

    const AdvancedMarker = window.google?.maps?.marker?.AdvancedMarkerElement

    stops.forEach((stop) => {
      const color = getMarkerColor(stop, selectedOrigin, selectedDestination)
      const size = getMarkerSize(stop, selectedOrigin, selectedDestination)
      const isSelected =
        selectedOrigin?.id === stop.id || selectedDestination?.id === stop.id

      if (AdvancedMarker) {
        const pinEl = document.createElement('div')
        pinEl.style.cssText = `
          width: ${size * 2}px; height: ${size * 2}px;
          border-radius: 50%; background: ${color};
          border: 2.5px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          ${isSelected ? 'transform: scale(1.2); box-shadow: 0 4px 14px rgba(0,0,0,0.35);' : ''}
        `

        const marker = new AdvancedMarker({
          map,
          position: { lat: stop.lat, lng: stop.lng },
          content: pinEl,
          title: stop.name,
        })

        marker.addListener('click', () => {
          setActiveMarker(stop)
          onStopClick?.(stop)
        })

        markersRef.current.push(marker)
        return
      }

      const marker = new window.google.maps.Marker({
        map,
        position: { lat: stop.lat, lng: stop.lng },
        title: stop.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2.5,
          scale: size,
        },
        animation: isSelected ? window.google.maps.Animation.BOUNCE : null,
      })

      marker.addListener('click', () => {
        setActiveMarker(stop)
        onStopClick?.(stop)
      })

      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach(clearMarker)
      markersRef.current = []
    }
  }, [map, isLoaded, stops, selectedOrigin, selectedDestination, onStopClick])

  useEffect(() => {
    // render the user's location separately from bus stop markers
    if (!map || !isLoaded || !userLocation) return

    clearMarker(userMarkerRef.current)
    userMarkerRef.current = null

    const AdvancedMarker = window.google?.maps?.marker?.AdvancedMarkerElement

    if (AdvancedMarker) {
      const el = document.createElement('div')
      el.className = 'user-location-marker'
      el.innerHTML = `
        <div class="user-loc-pulse"></div>
        <div class="user-loc-dot"></div>
      `

      userMarkerRef.current = new AdvancedMarker({
        map,
        position: { lat: userLocation.lat, lng: userLocation.lng },
        content: el,
        title: 'Your location',
      })
    } else {
      userMarkerRef.current = new window.google.maps.Marker({
        map,
        position: { lat: userLocation.lat, lng: userLocation.lng },
        title: 'Your location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
          scale: 8,
        },
        zIndex: 999,
      })
    }

    return () => {
      clearMarker(userMarkerRef.current)
      userMarkerRef.current = null
    }
  }, [map, isLoaded, userLocation])

  useEffect(() => {
    // render live buses independently so eta updates do not reset the map
    if (!map || !isLoaded) return

    liveBusMarkersRef.current.forEach(clearMarker)
    liveBusMarkersRef.current = []

    const AdvancedMarker = window.google?.maps?.marker?.AdvancedMarkerElement

    liveBuses.forEach((bus) => {
      if (AdvancedMarker) {
        const el = document.createElement('div')
        el.className = 'live-bus-marker'
        el.style.setProperty('--bus-color', bus.color || '#BA0C2F')
        el.innerHTML = `<span>${bus.label || 'Bus'}</span>`

        const marker = new AdvancedMarker({
          map,
          position: { lat: bus.latitude, lng: bus.longitude },
          content: el,
          title: bus.label || 'Active bus',
        })

        liveBusMarkersRef.current.push(marker)
        return
      }

      const marker = new window.google.maps.Marker({
        map,
        position: { lat: bus.latitude, lng: bus.longitude },
        title: bus.label || 'Active bus',
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: bus.color || '#BA0C2F',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 1.5,
          rotation: bus.bearing || 0,
        },
      })

      liveBusMarkersRef.current.push(marker)
    })

    return () => {
      liveBusMarkersRef.current.forEach(clearMarker)
      liveBusMarkersRef.current = []
    }
  }, [map, isLoaded, liveBuses])

  useEffect(() => {
    // fit the map to the active route only when the overlay path actually changes
    if (!map || !isLoaded || !routeOverlays.length || !window.google?.maps?.LatLngBounds) return

    const overlayKey = routeOverlays.map((overlay) => {
      const firstPoint = overlay.path[0]
      const lastPoint = overlay.path[overlay.path.length - 1]
      return [
        overlay.id,
        overlay.label,
        overlay.routeId,
        overlay.path.length,
        firstPoint?.lat,
        firstPoint?.lng,
        lastPoint?.lat,
        lastPoint?.lng,
      ].join(':')
    }).join('|')
    if (!overlayKey || overlayKey === previousOverlayKeyRef.current) return

    previousOverlayKeyRef.current = overlayKey

    const bounds = new window.google.maps.LatLngBounds()
    let hasPoints = false

    routeOverlays.forEach((overlay) => {
      overlay.path.forEach((point) => {
        bounds.extend(point)
        hasPoints = true
      })
    })

    if (selectedOrigin) {
      bounds.extend({ lat: selectedOrigin.lat, lng: selectedOrigin.lng })
      hasPoints = true
    }

    if (selectedDestination) {
      bounds.extend({ lat: selectedDestination.lat, lng: selectedDestination.lng })
      hasPoints = true
    }

    if (hasPoints) {
      map.fitBounds(bounds, 56)
      window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() > 16) map.setZoom(16)
      })
    }
  }, [map, isLoaded, routeOverlays, selectedOrigin, selectedDestination])

  if (loadError) {
    return (
      <div className="map-container map-error">
        <p>Failed to load Google Maps</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="map-container map-loading">
        <div className="spinner" />
        <p>Loading map...</p>
      </div>
    )
  }

  return (
    <div className="map-container">
      <div className="map-helper">Scroll to zoom, drag to pan, and tap a stop to plan your UGA bus route.</div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || UGA_CENTER}
        zoom={15}
        options={mapOptions}
        onLoad={onLoad}
        onClick={() => setActiveMarker(null)}
      >
        {routeOverlays.map((overlay) => (
          <Polyline
            key={overlay.id}
            path={overlay.path}
            options={{
              strokeColor: overlay.color,
              strokeOpacity: overlay.strokeDashArray ? 0 : (overlay.strokeOpacity ?? 0.9),
              strokeWeight: overlay.strokeWeight ?? 6,
              icons: overlay.strokeDashArray
                ? [
                    {
                      icon: {
                        path: 'M 0,-1 0,1',
                        strokeColor: overlay.color,
                        strokeOpacity: 1,
                        strokeWeight: 3,
                        scale: 4,
                      },
                      offset: '0',
                      repeat: `${overlay.strokeDashArray[0] + overlay.strokeDashArray[1]}px`,
                    },
                  ]
                : undefined,
            }}
          />
        ))}

        {activeMarker && (
          <InfoWindow
            position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <div className="map-info-window">
              <div className="map-info-window__header">
                <h4>{activeMarker.name}</h4>
                <button
                  type="button"
                  className="map-info-close"
                  onClick={() => setActiveMarker(null)}
                  aria-label="Close stop details"
                >
                  ×
                </button>
              </div>
              {activeMarker.route_names?.length > 0 && (
                <div className="map-info-routes">
                  {activeMarker.route_names.map((r) => (
                    <span
                      key={r}
                      className="route-badge route-badge--small"
                      style={getRouteBadgeStyle(r, routeStyleMap)}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
              <div className="map-info-actions">
                <button
                  type="button"
                  className="map-info-action"
                  onClick={() => onStopClick?.(activeMarker)}
                >
                  {selectedOrigin?.id === activeMarker.id || selectedDestination?.id === activeMarker.id
                    ? 'Unselect stop'
                    : 'Use this stop'}
                </button>
                {(selectedOrigin || selectedDestination) && (
                  <button
                    type="button"
                    className="map-info-action map-info-action--secondary"
                    onClick={() => {
                      onClearSelections?.()
                      setActiveMarker(null)
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

export default memo(BusMap, areMapPropsEqual)

function clearMarker(marker) {
  if (!marker) return
  if (marker.map) marker.map = null
  if (marker.remove) marker.remove()
  else if (marker.setMap) marker.setMap(null)
}

function areMapPropsEqual(previousProps, nextProps) {
  return (
    previousProps.stops === nextProps.stops &&
    previousProps.selectedOrigin?.id === nextProps.selectedOrigin?.id &&
    previousProps.selectedDestination?.id === nextProps.selectedDestination?.id &&
    previousProps.userLocation?.lat === nextProps.userLocation?.lat &&
    previousProps.userLocation?.lng === nextProps.userLocation?.lng &&
    previousProps.routeOverlays === nextProps.routeOverlays &&
    previousProps.liveBuses === nextProps.liveBuses &&
    previousProps.routeStyleMap === nextProps.routeStyleMap
  )
}
