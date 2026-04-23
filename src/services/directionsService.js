import config from '../config'

// Asks Google for directions between two places.
// In dev mode we go through the Vite proxy so the API key stays out of the browser network tab.
export async function getDirections(origin, destination, mode = 'transit') {
  const params = new URLSearchParams({
    origin,
    destination,
    mode,
    alternatives: 'true',
    key: config.google.mapsApiKey,
  })

  const url = config.isDev
    ? `/api/directions?${params}`
    : `${config.google.directionsUrl}?${params}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Google Directions returned ${response.status}`)
  }

  const data = await response.json()
  if (data.status !== 'OK') {
    throw new Error(data.error_message || `No routes found (${data.status})`)
  }

  return data.routes.map(formatRoute)
}

// Grabs both bus/transit and walking directions at the same time.
// Returns whatever succeeded — if one mode fails, the other still shows up.
export async function getTransitAndWalking(origin, destination) {
  const [transitResult, walkingResult] = await Promise.allSettled([
    getDirections(origin, destination, 'transit'),
    getDirections(origin, destination, 'walking'),
  ])

  return {
    transit: transitResult.status === 'fulfilled' ? transitResult.value : [],
    walking: walkingResult.status === 'fulfilled' ? walkingResult.value : [],
    errors: {
      transit: transitResult.status === 'rejected' ? transitResult.reason.message : null,
      walking: walkingResult.status === 'rejected' ? walkingResult.reason.message : null,
    },
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
      departureTimeValue: details.departure_time?.value, // unix timestamp in seconds
      arrivalTime: details.arrival_time?.text,
      arrivalTimeValue: details.arrival_time?.value,
      numStops: details.num_stops,
      agencyName: details.line.agencies?.[0]?.name,
    }
  }

  return step
}
