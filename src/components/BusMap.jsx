import { useState, useCallback, useEffect, useRef } from 'react'
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api'

const UGA_CENTER = { lat: 33.9519, lng: -83.3763 }

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0',
}

// Sleek dark-tinted map theme
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
}

function getMarkerColor(stop, selectedOrigin, selectedDestination) {
  if (selectedOrigin?.id === stop.id) return '#22c55e'
  if (selectedDestination?.id === stop.id) return '#ef4444'
  return '#BA0C2F'
}

function getMarkerSize(stop, selectedOrigin, selectedDestination) {
  if (selectedOrigin?.id === stop.id || selectedDestination?.id === stop.id) return 14
  return 9
}

export default function BusMap({ stops, selectedOrigin, selectedDestination, onStopClick, userLocation }) {
  const [activeMarker, setActiveMarker] = useState(null)
  const [map, setMap] = useState(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance)
  }, [])

  // Bus stop markers
  useEffect(() => {
    if (!map || !isLoaded || !stops.length) return

    // Clear old markers
    markersRef.current.forEach((m) => {
      if (m.map) m.map = null
      if (m.remove) m.remove()
      else if (m.setMap) m.setMap(null)
    })
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
      } else {
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
      }
    })

    return () => {
      markersRef.current.forEach((m) => {
        if (m.map) m.map = null
        if (m.remove) m.remove()
        else if (m.setMap) m.setMap(null)
      })
      markersRef.current = []
    }
  }, [map, isLoaded, stops, selectedOrigin, selectedDestination, onStopClick])

  // User location marker (blue pulsing dot)
  useEffect(() => {
    if (!map || !isLoaded || !userLocation) return

    // Remove previous user marker
    if (userMarkerRef.current) {
      if (userMarkerRef.current.remove) userMarkerRef.current.remove()
      else if (userMarkerRef.current.setMap) userMarkerRef.current.setMap(null)
      userMarkerRef.current = null
    }

    const AdvancedMarker = window.google?.maps?.marker?.AdvancedMarkerElement

    if (AdvancedMarker) {
      const el = document.createElement('div')
      el.className = 'user-location-marker'
      el.innerHTML = `
        <div class="user-loc-pulse"></div>
        <div class="user-loc-dot"></div>
      `

      const marker = new AdvancedMarker({
        map,
        position: { lat: userLocation.lat, lng: userLocation.lng },
        content: el,
        title: 'Your location',
      })

      userMarkerRef.current = marker
    } else {
      const marker = new window.google.maps.Marker({
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

      userMarkerRef.current = marker
    }

    return () => {
      if (userMarkerRef.current) {
        if (userMarkerRef.current.remove) userMarkerRef.current.remove()
        else if (userMarkerRef.current.setMap) userMarkerRef.current.setMap(null)
        userMarkerRef.current = null
      }
    }
  }, [map, isLoaded, userLocation])

  if (loadError) {
    return (
      <div className="map-container map-error">
        <p>⚠️ Failed to load Google Maps</p>
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
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userLocation || UGA_CENTER}
        zoom={15}
        options={mapOptions}
        onLoad={onLoad}
        onClick={() => setActiveMarker(null)}
      >
        {activeMarker && (
          <InfoWindow
            position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <div className="map-info-window">
              <h4>{activeMarker.name}</h4>
              {activeMarker.route_names?.length > 0 && (
                <div className="map-info-routes">
                  {activeMarker.route_names.map((r) => (
                    <span key={r} className="route-badge route-badge--small">{r}</span>
                  ))}
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}
