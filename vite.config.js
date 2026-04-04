import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy Google Directions API to keep API key server-side in production
        '/api/directions': {
          target: 'https://maps.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/directions/, '/maps/api/directions/json'),
        },
        // Proxy Passio GTFS-RT to avoid CORS issues
        '/passio-api': {
          target: 'https://passio3.com/uga/passioTransit',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/passio-api/, ''),
        },
      },
    },
  }
})
