import { matchRouteById, matchRouteByName } from '../hooks/useBusRoutes'

export function decodePolyline(encoded) {
  if (!encoded) return []

  let index = 0
  let lat = 0
  let lng = 0
  const coordinates = []

  while (index < encoded.length) {
    let result = 0
    let shift = 0
    let byte

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1
    lat += deltaLat

    result = 0
    shift = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1
    lng += deltaLng

    coordinates.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    })
  }

  return coordinates
}

export function buildMapOverlays({ transitRoutes = [], walkingRoutes = [], busRoutes = [], stops = [] }) {
  const overlays = []
  const activeRouteIds = new Set()

  transitRoutes.forEach((route, routeIndex) => {
    const routeSegments = route.steps
      .map((step, stepIndex) => {
        const isTransit = step.travelMode === 'TRANSIT'
        const matchedRoute = isTransit
          ? matchRouteByName(busRoutes, step.transit?.lineName)
          : null

        if (matchedRoute?.routeId) activeRouteIds.add(matchedRoute.routeId)

        const path = isTransit
          ? getTransitPath(step, matchedRoute, stops)
          : getStepPath(step)

        if (!path.length) return null

        return {
          id: `${routeIndex}-${stepIndex}-${isTransit ? 'transit' : 'walk'}`,
          kind: isTransit ? 'transit' : 'walking',
          label: isTransit
            ? step.transit?.lineName || 'Transit'
            : `Walk ${step.distance || ''}`.trim(),
          color: isTransit ? matchedRoute?.color || '#BA0C2F' : '#0F766E',
          routeId: matchedRoute?.routeId || step.transit?.lineName || '',
          path,
          strokeOpacity: isTransit ? 0.95 : 0.85,
          strokeWeight: isTransit ? 6 : 5,
          strokeDashArray: isTransit ? null : [8, 8],
        }
      })
      .filter(Boolean)

    overlays.push(...routeSegments)

    if (!routeSegments.length && route.polyline) {
      const fallbackPath = decodePolyline(route.polyline)
      if (fallbackPath.length) {
        overlays.push({
          id: `transit-route-${routeIndex}`,
          kind: 'transit',
          label: route.summary || 'Transit route',
          color: '#BA0C2F',
          routeId: `transit-${routeIndex}`,
          path: fallbackPath,
          strokeOpacity: 0.95,
          strokeWeight: 6,
          strokeDashArray: null,
        })
      }
    }
  })

  walkingRoutes.forEach((route, routeIndex) => {
    const path = route.polyline ? decodePolyline(route.polyline) : []
    if (!path.length) return

    overlays.push({
      id: `walking-route-${routeIndex}`,
      kind: 'walking',
      label: 'Walking option',
      color: '#0F766E',
      routeId: `walking-${routeIndex}`,
      path,
      strokeOpacity: 0.65,
      strokeWeight: 5,
      strokeDashArray: [10, 8],
    })
  })

  return {
    overlays,
    activeRouteIds: [...activeRouteIds],
  }
}

export function buildVisibleLiveBuses(vehicles = [], busRoutes = [], activeRouteIds = []) {
  const shouldFilter = activeRouteIds.length > 0

  return vehicles
    .filter((vehicle) => {
      if (!Number.isFinite(vehicle.latitude) || !Number.isFinite(vehicle.longitude)) return false
      if (!shouldFilter) return true
      const matchedRoute = matchRouteById(busRoutes, vehicle.routeId)
      if (!matchedRoute) return activeRouteIds.includes(vehicle.routeId)
      return activeRouteIds.includes(matchedRoute.routeId) || activeRouteIds.includes(matchedRoute.routeGroupId)
    })
    .map((vehicle) => {
      const matchedRoute = matchRouteById(busRoutes, vehicle.routeId)
      return {
        ...vehicle,
        color: matchedRoute?.color || '#BA0C2F',
        label: matchedRoute?.shortName || matchedRoute?.name || vehicle.vehicleLabel || vehicle.routeId,
      }
    })
}

function getTransitPath(step, matchedRoute, stops) {
  const stepPath = getStepPath(step)
  if (stepPath.length) return stepPath

  const nestedPath = getNestedTransitPath(step)
  if (nestedPath.length) return nestedPath

  if (matchedRoute?.path?.length) return matchedRoute.path

  const fallbackPath = buildPathFromStops(step, matchedRoute, stops)
  return fallbackPath
}

function getStepPath(step) {
  if (!step?.polyline) return []
  return decodePolyline(step.polyline)
}

function getNestedTransitPath(step) {
  if (!step?.steps?.length) return []

  return step.steps.flatMap((nestedStep) => {
    if (!nestedStep?.polyline) return []
    return decodePolyline(nestedStep.polyline)
  })
}

function buildPathFromStops(step, matchedRoute, stops) {
  const departures = [step.transit?.departureStop, step.transit?.arrivalStop].filter(Boolean)
  const stopNameSet = new Set(
    [...(matchedRoute?.stopNames || []), ...departures].map((value) => normalizeText(value))
  )
  const stopIdSet = new Set((matchedRoute?.stopIds || []).map((value) => String(value)))

  const matchedStops = stops.filter((stop) => {
    if (stopIdSet.has(String(stop.id))) return true
    return stopNameSet.has(normalizeText(stop.name))
  })

  return matchedStops
    .map((stop) => ({ lat: stop.lat, lng: stop.lng }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
