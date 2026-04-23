// Asks Google for directions between two places using the Maps JavaScript SDK.
// We can't call the Directions REST endpoint directly from the browser — it does
// not send CORS headers — so we use google.maps.DirectionsService instead, which
// is already loaded by @react-google-maps/api inside <BusMap>.

const SDK_WAIT_TIMEOUT_MS = 10000

export async function getDirections(origin, destination, mode = 'transit', options = {}) {
  const maps = await waitForGoogleMaps()
  const service = new maps.DirectionsService()

  const travelMode = maps.TravelMode[mode.toUpperCase()]
  if (!travelMode) {
    const error = new Error(`Unsupported travel mode: ${mode}`)
    error.status = 'INVALID_REQUEST'
    throw error
  }

  const request = {
    origin: parseLocation(origin),
    destination: parseLocation(destination),
    travelMode,
    provideRouteAlternatives: true,
  }

  // Transit mode requires a departure (or arrival) time. Without it the SDK
  // can return ZERO_RESULTS simply because there is no implicit "now".
  if (mode === 'transit') {
    const departureMs = options.departureTime
      ? Number(options.departureTime) * 1000
      : Date.now()
    request.transitOptions = { departureTime: new Date(departureMs) }
  }

  const result = await new Promise((resolve, reject) => {
    service.route(request, (response, status) => {
      if (status === maps.DirectionsStatus.OK && response) {
        resolve(response)
      } else {
        const error = new Error(`No routes found (${status})`)
        error.status = status
        reject(error)
      }
    })
  })

  return result.routes.map(formatRoute)
}

// Grabs both bus/transit and walking directions at the same time.
// Returns whatever succeeded — if one mode fails, the other still shows up.
export async function getTransitAndWalking(origin, destination, options = {}) {
  const [transitResult, walkingResult] = await Promise.allSettled([
    getDirections(origin, destination, 'transit', options),
    getDirections(origin, destination, 'walking'),
  ])

  return {
    transit: transitResult.status === 'fulfilled' ? transitResult.value : [],
    walking: walkingResult.status === 'fulfilled' ? walkingResult.value : [],
    errors: {
      transit: transitResult.status === 'rejected' ? formatError(transitResult.reason) : null,
      walking: walkingResult.status === 'rejected' ? formatError(walkingResult.reason) : null,
    },
  }
}

// Wait for @react-google-maps/api to finish loading the JS SDK. The map mounts
// on the home page so by the time the user clicks "Find Route" it is normally
// ready, but we still poll briefly for the case where the lookup runs first.
function waitForGoogleMaps() {
  if (window.google?.maps?.DirectionsService) {
    return Promise.resolve(window.google.maps)
  }

  return new Promise((resolve, reject) => {
    const start = Date.now()
    const interval = window.setInterval(() => {
      if (window.google?.maps?.DirectionsService) {
        window.clearInterval(interval)
        resolve(window.google.maps)
      } else if (Date.now() - start > SDK_WAIT_TIMEOUT_MS) {
        window.clearInterval(interval)
        const error = new Error('Google Maps SDK failed to load')
        error.status = 'SDK_NOT_LOADED'
        reject(error)
      }
    }, 100)
  })
}

function parseLocation(value) {
  if (typeof value !== 'string') return value
  const match = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
  if (!match) return value
  return { lat: Number(match[1]), lng: Number(match[2]) }
}

function formatError(reason) {
  return {
    message: reason?.message || 'Unknown error',
    status: reason?.status || null,
  }
}

// Pulls out the useful bits from a raw Google route object
function formatRoute(rawRoute) {
  const leg = rawRoute.legs[0]

  return {
    summary: rawRoute.summary,
    distance: leg.distance?.text || '',
    duration: leg.duration?.text || '',
    startAddress: leg.start_address,
    endAddress: leg.end_address,
    startLocation: toLatLng(leg.start_location),
    endLocation: toLatLng(leg.end_location),
    steps: leg.steps.map(formatStep),
    polyline: extractPolyline(rawRoute.overview_polyline),
    bounds: null,
  }
}

// Formats a single step — could be walking or a bus ride
function formatStep(rawStep) {
  const step = {
    instruction: rawStep.instructions || rawStep.html_instructions || '',
    distance: rawStep.distance?.text || '',
    duration: rawStep.duration?.text || '',
    travelMode: rawStep.travel_mode,
    polyline: extractPolyline(rawStep.polyline),
    startLocation: toLatLng(rawStep.start_location),
    endLocation: toLatLng(rawStep.end_location),
  }

  // If this step involves a bus or train, pull out the transit-specific info
  if (rawStep.transit_details || rawStep.transit) {
    const details = rawStep.transit_details || rawStep.transit
    step.transit = {
      lineName: details.line.short_name || details.line.name,
      lineColor: details.line.color,
      vehicleType: details.line.vehicle?.type,
      departureStop: details.departure_stop.name,
      arrivalStop: details.arrival_stop.name,
      departureTime: details.departure_time?.text,
      arrivalTime: details.arrival_time?.text,
      numStops: details.num_stops,
      agencyName: details.line.agencies?.[0]?.name,
    }
  }

  return step
}

// LatLng objects from the JS SDK expose .lat()/.lng() methods. REST responses
// (and our tests) use plain {lat, lng} — handle both.
function toLatLng(location) {
  if (!location) return null
  if (typeof location.lat === 'function') {
    return { lat: location.lat(), lng: location.lng() }
  }
  return { lat: location.lat, lng: location.lng }
}

// Polyline can be a string (REST) or an object with .points (JS SDK).
function extractPolyline(polyline) {
  if (!polyline) return ''
  if (typeof polyline === 'string') return polyline
  return polyline.points || ''
}
