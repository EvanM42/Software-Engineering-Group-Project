import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/directions': {
        target: 'https://maps.googleapis.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/directions/, '/maps/api/directions/json'),
      },
      '/passio-api': {
        target: 'https://passio3.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/passio-api/, '/uga/passioTransit'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
    css: true,
  },
})
