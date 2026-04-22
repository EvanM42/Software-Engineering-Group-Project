import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// fallback colors keep route badges readable when the database is missing colors
const FALLBACK_ROUTE_COLORS = [
  '#BA0C2F',
  '#0F766E',
  '#1D4ED8',
  '#CA8A04',
  '#7C3AED',
  '#EA580C',
  '#BE185D',
  '#15803D',
]

export function useBusRoutes() {
  // route list state for the app
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRoutes = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await fetchRouteRows()

    if (fetchError) {
      setError(fetchError.message)
      setRoutes([])
      setLoading(false)
      return
    }

    setRoutes((data || []).map(normalizeBusRoute))
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchRoutes()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [fetchRoutes])

  return { routes, loading, error, refetch: fetchRoutes }
}

export function normalizeBusRoute(route, index = 0) {
  // normalize route names and ids so matching works across google and supabase data
  const name =
    route.route_name ||
    route.name ||
    route.short_name ||
    route.route_short_name ||
    route.route_id ||
    route.id ||
    `Route ${index + 1}`

  const shortName =
    route.short_name ||
    route.route_short_name ||
    route.route_name ||
    route.name ||
    ''

  const normalizedName = cleanRouteLabel(name)
  const normalizedShortName = cleanRouteLabel(shortName)
  const routeId = String(
    route.route_id ||
    route.myid ||
    route.group_id ||
    route.id ||
    normalizedName
  )
  const routeGroupId = route.group_id ? String(route.group_id) : ''
  const aliases = [
    normalizedName,
    normalizedShortName,
    route.route_id,
    route.myid,
    route.group_id,
    route.id,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim())

  return {
    ...route,
    id: String(route.id || route.myid || route.group_id || route.route_id || normalizedName),
    routeId,
    routeGroupId,
    name: normalizedName,
    shortName: normalizedShortName,
    aliases,
    color: normalizeRouteColor(
      route.route_color || route.color || route.hex_color || route.route_hex_color,
      index
    ),
    path: extractRoutePath(route),
    stopIds: toStringArray(route.stop_ids || route.stopIds),
    stopNames: toStringArray(route.stop_names || route.stopNames),
  }
}

export function matchRouteByName(routes, routeName) {
  if (!routeName) return null

  const normalizedTarget = normalizeText(routeName)

  return (
    routes.find((route) => {
      const candidates = [
        route.name,
        route.shortName,
        route.routeId,
        route.routeGroupId,
        ...(route.aliases || []),
        route.route_name,
        route.short_name,
        route.route_short_name,
      ]

      return candidates
        .filter(Boolean)
        .some((candidate) => normalizeText(candidate) === normalizedTarget)
    }) ||
    routes.find((route) => {
      const candidates = [route.name, route.shortName, route.routeId, route.routeGroupId, ...(route.aliases || [])].filter(Boolean)
      return candidates.some((candidate) =>
        normalizeText(candidate).includes(normalizedTarget) ||
        normalizedTarget.includes(normalizeText(candidate))
      )
    }) ||
    null
  )
}

export function matchRouteById(routes, routeId) {
  if (!routeId) return null

  const normalizedTarget = normalizeText(routeId)
  return routes.find((route) =>
    [route.routeId, route.routeGroupId, route.name, route.shortName, ...(route.aliases || [])]
      .filter(Boolean)
      .some((candidate) => normalizeText(candidate) === normalizedTarget)
  ) || null
}

function normalizeRouteColor(color, index) {
  if (!color) return FALLBACK_ROUTE_COLORS[index % FALLBACK_ROUTE_COLORS.length]

  const trimmed = String(color).trim()
  if (!trimmed) return FALLBACK_ROUTE_COLORS[index % FALLBACK_ROUTE_COLORS.length]
  if (trimmed.startsWith('#')) return trimmed
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`
  return trimmed
}

async function fetchRouteRows() {
  // prefer the dedicated bus_routes table but fall back to routes when needed
  const primary = await supabase.from('bus_routes').select('*')
  if (!primary.error) return primary

  const fallback = await supabase.from('routes').select('*')
  return fallback
}

function extractRoutePath(route) {
  const candidate =
    route.path ||
    route.path_points ||
    route.shape_points ||
    route.coordinates ||
    route.route_path ||
    route.route_points

  if (!candidate) return []

  if (Array.isArray(candidate)) {
    return candidate
      .map((point) => normalizePoint(point))
      .filter(Boolean)
  }

  if (typeof candidate === 'string') {
    try {
      const parsed = JSON.parse(candidate)
      if (Array.isArray(parsed)) {
        return parsed.map((point) => normalizePoint(point)).filter(Boolean)
      }
    } catch {
      return []
    }
  }

  return []
}

function normalizePoint(point) {
  if (!point) return null

  if (Array.isArray(point) && point.length >= 2) {
    const [lat, lng] = point
    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      return { lat: Number(lat), lng: Number(lng) }
    }
  }

  const lat = point.lat ?? point.latitude
  const lng = point.lng ?? point.lon ?? point.longitude

  if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
    return { lat: Number(lat), lng: Number(lng) }
  }

  return null
}

function toStringArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String)

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  return []
}

function cleanRouteLabel(value) {
  return String(value || '').trim()
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
