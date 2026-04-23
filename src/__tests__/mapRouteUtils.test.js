import { describe, it, expect, vi } from 'vitest'
import { 
  decodePolyline, 
  buildMapOverlays, 
  buildVisibleLiveBuses 
} from '../utils/mapRouteUtils'

describe('mapRouteUtils', () => {
  describe('decodePolyline', () => {
    it('decodes a simple encoded polyline', () => {
      // Small encoded polyline for (38.5, -120.2), (40.7, -120.9)
      const encoded = '_p~iF~ps|U_ulLnnqC'
      const coords = decodePolyline(encoded)
      expect(coords).toHaveLength(2)
      expect(coords[0].lat).toBeCloseTo(38.5, 1)
      expect(coords[1].lng).toBeCloseTo(-120.9, 1)
    })

    it('returns empty array for invalid/empty input', () => {
      expect(decodePolyline('')).toEqual([])
      expect(decodePolyline(null)).toEqual([])
    })
  })

  describe('buildMapOverlays', () => {
    const mockBusRoutes = [
      { routeId: 'r1', name: 'Orbit', color: '#FF0000' }
    ]
    const mockStops = [
      { id: 's1', name: 'Tate', lat: 33.9, lng: -83.3 }
    ]

    it('builds transit overlays from transit routes', () => {
      const transitRoutes = [{
        steps: [
          {
            travelMode: 'TRANSIT',
            transit: { lineName: 'Orbit' },
            polyline: '_p~iF~ps|U'
          }
        ]
      }]
      
      const { overlays, activeRouteIds } = buildMapOverlays({ 
        transitRoutes, 
        busRoutes: mockBusRoutes, 
        stops: mockStops 
      })

      expect(overlays).toHaveLength(1)
      expect(overlays[0].kind).toBe('transit')
      expect(overlays[0].label).toBe('Orbit')
      expect(overlays[0].color).toBe('#FF0000')
      expect(activeRouteIds).toContain('r1')
    })

    it('builds walking overlays', () => {
      const walkingRoutes = [{
        polyline: '_p~iF~ps|U'
      }]
      
      const { overlays } = buildMapOverlays({ walkingRoutes })
      expect(overlays).toHaveLength(1)
      expect(overlays[0].kind).toBe('walking')
      expect(overlays[0].strokeDashArray).toEqual([10, 8])
    })

    it('handles fallback to summary polyline if steps are empty', () => {
      const transitRoutes = [{
        summary: 'Direct route',
        polyline: '_p~iF~ps|U',
        steps: []
      }]
      
      const { overlays } = buildMapOverlays({ transitRoutes })
      expect(overlays).toHaveLength(1)
      expect(overlays[0].label).toBe('Direct route')
    })
  })

  describe('buildVisibleLiveBuses', () => {
    const busRoutes = [
      { routeId: 'r1', shortName: 'OR', color: '#FF0000' }
    ]
    const vehicles = [
      { vehicleId: 'v1', routeId: 'r1', latitude: 33.9, longitude: -83.3 },
      { vehicleId: 'v2', routeId: 'r2', latitude: 34.0, longitude: -83.4 },
      { vehicleId: 'v3', routeId: 'r1', latitude: NaN, longitude: 0 }
    ]

    it('filters out invalid coordinates', () => {
      const visible = buildVisibleLiveBuses(vehicles, busRoutes)
      expect(visible).toHaveLength(2)
      expect(visible.some(v => v.vehicleId === 'v3')).toBe(false)
    })

    it('filters by activeRouteIds if provided', () => {
      const visible = buildVisibleLiveBuses(vehicles, busRoutes, ['r1'])
      expect(visible).toHaveLength(1)
      expect(visible[0].vehicleId).toBe('v1')
    })

    it('assigns colors and labels from routes', () => {
      const visible = buildVisibleLiveBuses(vehicles, busRoutes)
      const v1 = visible.find(v => v.vehicleId === 'v1')
      expect(v1.color).toBe('#FF0000')
      expect(v1.label).toBe('OR')
    })
  })

  describe('Internal Path Building Helpers', () => {
    it('builds path from stops when polyline is missing', () => {
      const busRoutes = [{
        routeId: 'r1',
        name: 'Orbit',
        stopIds: ['s1', 's2']
      }]
      const stops = [
        { id: 's1', name: 'Stop 1', lat: 33.1, lng: -83.1 },
        { id: 's2', name: 'Stop 2', lat: 33.2, lng: -83.2 }
      ]
      const transitRoutes = [{
        steps: [{
          travelMode: 'TRANSIT',
          transit: { lineName: 'Orbit', departureStop: 'Stop 1', arrivalStop: 'Stop 2' }
          // Missing polyline
        }]
      }]

      const { overlays } = buildMapOverlays({ transitRoutes, busRoutes, stops })
      expect(overlays[0].path).toHaveLength(2)
      expect(overlays[0].path[1].lat).toBe(33.2)
    })
  })
})
