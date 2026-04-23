import config from '../config'

// Asks Google for directions between two places.
// In dev mode we go through the Vite proxy so the API key stays out of the browser network tab.
export async function getDirections(origin, destination, mode = 'transit', options = {}) {
  const params = new URLSearchParams({
    origin,
    destination,
    mode,
    alternatives: 'true',
    key: config.google.mapsApiKey,
  })

  // Transit mode requires a departure_time. Without it Google can return ZERO_RESULTS
  // simply because no buses are running at the implicit "now". Use the caller-provided
  // time (Unix seconds) or fall back to the literal "now" keyword Google accepts.
  if (mode === 'transit') {
    const departureTime = options.departureTime ?? 'now'
    params.set('departure_time', String(departureTime))
  }

  const url = config.isDev
    ? `/api/directions?${params}`
    : `${config.google.directionsUrl}?${params}`

  const response = await fetch(url)
  if (!response.ok) {
    const error = new Error(`Google Directions returned ${response.status}`)
    error.status = `HTTP_${response.status}`
    throw error
  }

  const data = await response.json()
  if (data.status !== 'OK') {
    const error = new Error(data.error_message || `No routes found (${data.status})`)
    error.status = data.status
    throw error
  }

  return data.routes.map(formatRoute)
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
    distance: leg.distance.text,
    duration: leg.duration.text,
    startAddress: leg.start_address,
    endAddress: leg.end_address,
    startLocation: leg.start_location,
    endLocation: leg.end_location,
    steps: leg.steps.map(formatStep),
    polyline: rawRoute.overview_polyline.points,
    bounds: rawRoute.bounds,
  }
}

// Formats a single step — could be walking or a bus ride
function formatStep(rawStep) {
  const step = {
    instruction: rawStep.html_instructions,
    distance: rawStep.distance.text,
    duration: rawStep.duration.text,
    travelMode: rawStep.travel_mode,
    polyline: rawStep.polyline?.points || '',
    startLocation: rawStep.start_location,
    endLocation: rawStep.end_location,
  }

  // If this step involves a bus or train, pull out the transit-specific info
  if (rawStep.transit_details) {
    const details = rawStep.transit_details
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
