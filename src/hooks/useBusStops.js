import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useBusStops() {
  // stop list state for the app
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStops = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('bus_stops')
      .select('*')
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setStops([])
    } else {
      setStops(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchStops()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetchStops])

  return { stops, loading, error, refetch: fetchStops }
}

// get the nearest stops to the current location
export function getNearbyStops(stops, lat, lng, count = 5) {
  if (!stops.length || lat == null || lng == null) return []

  return stops
    .map((stop) => ({
      ...stop,
      distance: getDistanceKm(lat, lng, stop.lat, stop.lng),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
}

// calculate distance in kilometers
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}
