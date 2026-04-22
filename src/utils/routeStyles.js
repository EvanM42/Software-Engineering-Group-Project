export function buildRouteStyleMap(routes = []) {
  return routes.reduce((styleMap, route) => {
    const color = normalizeColor(route.color) || '#BA0C2F'
    const textColor = getContrastTextColor(color)

    ;[route.name, route.shortName, route.routeId, ...(route.aliases || [])]
      .filter(Boolean)
      .forEach((value) => {
        styleMap[normalizeText(value)] = {
          backgroundColor: color,
          color: textColor,
          borderColor: color,
        }
      })

    return styleMap
  }, {})
}

export function getRouteBadgeStyle(routeName, routeStyleMap = {}) {
  return routeStyleMap[normalizeText(routeName)] || {
    backgroundColor: '#BA0C2F',
    color: '#ffffff',
    borderColor: '#BA0C2F',
  }
}

function normalizeColor(color) {
  const trimmed = String(color || '').trim()
  if (!trimmed) return null
  if (trimmed.startsWith('#')) return trimmed
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`
  return null
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getContrastTextColor(hexColor) {
  const normalized = hexColor.replace('#', '')
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  const brightness = (red * 299 + green * 587 + blue * 114) / 1000
  return brightness > 155 ? '#111827' : '#ffffff'
}
