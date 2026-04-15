// One-time script to seed UGA bus routes from a saved Passio JSON file into Supabase
// 1. In browser DevTools Network tab, find the mapGetData.php?getRoutes request
// 2. Right-click the response -> Save as -> save as routes_data.json in this folder
// 3. Run with: node seed_bus_routes.js
// You can also pass a different file path: node seed_bus_routes.js ./my_routes.json

import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'

const SUPABASE_URL = 'https://wnvegqarxreguiwearrj.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudmVncWFyeHJlZ3Vpd2VhcnJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3ODI5MCwiZXhwIjoyMDkwNTU0MjkwfQ.YmeIrI_lAsE4vIudRgIIPSh7KLJrfopt0G_p-aCnhYA'

const ROUTES_TABLE = 'routes'
const DATA_FILE = process.argv[2] || './routes_data.json'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function flattenGroupRoutes(groupRoutes) {
  const flattened = {}

  for (const group of Object.values(groupRoutes || {})) {
    if (group && typeof group === 'object' && !Array.isArray(group)) {
      Object.assign(flattened, group)
    }
  }

  return flattened
}

function normalizePassioRoute(route) {
  return {
    myid: route.myid,
    name: (route.name || route.nameOrig || '').trim(),
    short_name: route.shortName || null,
    color: route.groupColor || route.color || null,
    group_id: route.groupId || null,
    latitude: route.latitude != null ? parseFloat(route.latitude) : null,
    longitude: route.longitude != null ? parseFloat(route.longitude) : null,
    is_active: route.outdated === '0',
    show_schedule: route.goShowSchedule === 1
  }
}

function normalizeRoutesArray(routes) {
  return routes
    .filter((route) => route?.myid && (route.name || route.nameOrig))
    .map(normalizePassioRoute)
}

function normalizeEmbeddedRoutes(data) {
  if (!data.routes || typeof data.routes !== 'object') {
    throw new Error('No routes array or routes object found in the JSON file')
  }

  const groupRouteMap = flattenGroupRoutes(data.groupRoutes)

  return Object.entries(data.routes).map(([routeId, routeData]) => {
    const routeMeta = groupRouteMap[routeId] || {}

    return {
      myid: routeId,
      name: (routeMeta.name || routeData[0] || '').trim(),
      short_name: data.routeShortNames?.[routeId] || null,
      color: routeMeta.color || routeData[1] || null,
      group_id: routeMeta.routeGroupId || routeMeta.id || null,
      latitude: routeMeta.latitude != null ? parseFloat(routeMeta.latitude) : null,
      longitude: routeMeta.longitude != null ? parseFloat(routeMeta.longitude) : null,
      is_active: true,
      show_schedule: Boolean(data.routeSchedules?.[routeId])
    }
  })
}

async function seedBusRoutes() {
  if (!existsSync(DATA_FILE)) {
    throw new Error(`Could not find ${DATA_FILE}`)
  }

  console.log(`Reading routes from ${DATA_FILE}...`)

  const raw = readFileSync(DATA_FILE, 'utf-8')
  const data = JSON.parse(raw)

  const routesArray = Array.isArray(data)
    ? normalizeRoutesArray(data)
    : normalizeEmbeddedRoutes(data)

  if (routesArray.length === 0) {
    throw new Error('No valid routes found to insert')
  }

  console.log(`Found ${routesArray.length} routes. Inserting into Supabase...`)

  const { error } = await supabase.from(ROUTES_TABLE).insert(routesArray)

  if (error) {
    console.error('Insert failed:', error.message)
  } else {
    console.log(`Successfully inserted ${routesArray.length} bus routes.`)
  }
}

seedBusRoutes().catch((error) => {
  console.error('Seeding failed:', error.message)
})
