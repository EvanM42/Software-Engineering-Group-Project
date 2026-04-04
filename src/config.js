// Central configuration — all API keys and URLs live here.
// Every service imports from this file instead of reading env vars directly.

const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  google: {
    mapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    directionsUrl: 'https://maps.googleapis.com/maps/api/directions/json',
  },
  passio: {
    baseUrl: import.meta.env.VITE_PASSIO_BASE_URL || 'https://passio3.com/uga/passioTransit',
    vehiclePositionsPath: '/gtfs-rt/vehiclePositions',
    tripUpdatesPath: '/gtfs-rt/tripUpdates',
  },
  isDev: import.meta.env.DEV,
}

// Warn during development if keys are missing
if (config.isDev) {
  const missing = []
  if (!config.supabase.url) missing.push('VITE_SUPABASE_URL')
  if (!config.supabase.anonKey) missing.push('VITE_SUPABASE_ANON_KEY')
  if (!config.google.mapsApiKey) missing.push('VITE_GOOGLE_MAPS_API_KEY')

  if (missing.length > 0) {
    console.warn(
      `[UGA Transit] Missing environment variables: ${missing.join(', ')}\n` +
      'Copy .env.example to .env and fill in your keys.'
    )
  }
}

export default config
