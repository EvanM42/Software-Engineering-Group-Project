import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDirections, getTransitAndWalking } from '../services/directionsService'
import config from '../config'

// Mock global fetch
global.fetch = vi.fn()

const mockGoogleResponse = {
  status: 'OK',
  routes: [
    {
      summary: 'Route 1',
      bounds: { northeast: { lat: 34, lng: -83 }, southwest: { lat: 33, lng: -84 } },
      overview_polyline: { points: 'abc' },
      legs: [
        {
          distance: { text: '1.2 km' },
          duration: { text: '15 mins' },
          start_address: 'Start St',
          end_address: 'End St',
          start_location: { lat: 33.95, lng: -83.37 },
          end_location: { lat: 33.96, lng: -83.38 },
          steps: [
            {
              html_instructions: 'Walk to stop',
              distance: { text: '200 m' },
              duration: { text: '2 mins' },
              travel_mode: 'WALKING',
              start_location: { lat: 33.95, lng: -83.37 },
              end_location: { lat: 33.951, lng: -83.371 }
            },
            {
              html_instructions: 'Take Orbit',
              distance: { text: '1 km' },
              duration: { text: '10 mins' },
              travel_mode: 'TRANSIT',
              transit_details: {
                line: { 
                  short_name: 'OR', 
                  name: 'Orbit', 
                  color: '#FF0000',
                  vehicle: { type: 'BUS' },
                  agencies: [{ name: 'UGA Transit' }]
                },
                departure_stop: { name: 'Tate Center' },
                arrival_stop: { name: 'Main Library' },
                departure_time: { text: '10:00 AM', value: 1713873600 },
                arrival_time: { text: '10:10 AM', value: 1713874200 },
                num_stops: 3
              },
              polyline: { points: 'def' }
            }
          ]
        }
      ]
    }
  ]
}

describe('directionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDirections', () => {
    it('uses proxy URL in dev mode', async () => {
      config.isDev = true
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockGoogleResponse,
      })

      await getDirections('Origin', 'Destination', 'transit')
      
      const calledUrl = fetch.mock.calls[0][0]
      expect(calledUrl).toContain('/api/directions')
      expect(calledUrl).toContain('origin=Origin')
      expect(calledUrl).toContain('mode=transit')
    })

    it('uses direct Google URL in production mode', async () => {
      config.isDev = false
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockGoogleResponse,
      })

      await getDirections('Origin', 'Destination', 'walking')
      
      const calledUrl = fetch.mock.calls[0][0]
      expect(calledUrl).toContain('maps.googleapis.com/maps/api/directions/json')
    })

    it('formats the Google response into a clean internal object', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockGoogleResponse,
      })

      const routes = await getDirections('A', 'B')
      const route = routes[0]

      expect(route.summary).toBe('Route 1')
      expect(route.distance).toBe('1.2 km')
      expect(route.duration).toBe('15 mins')
      expect(route.steps).toHaveLength(2)
      
      const transitStep = route.steps[1]
      expect(transitStep.travelMode).toBe('TRANSIT')
      expect(transitStep.transit.lineName).toBe('OR')
      expect(transitStep.transit.departureStop).toBe('Tate Center')
      expect(transitStep.transit.departureTimeValue).toBe(1713873600)
    })

    it('throws error when network response is not ok', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      await expect(getDirections('A', 'B')).rejects.toThrow('Google Directions returned 500')
    })

    it('throws error when Google returns a non-OK status', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ZERO_RESULTS', error_message: 'Not found' }),
      })

      await expect(getDirections('A', 'B')).rejects.toThrow('Not found')
    })
  })

  describe('getTransitAndWalking', () => {
    it('returns both transit and walking routes when both succeed', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => mockGoogleResponse,
      })

      const result = await getTransitAndWalking('A', 'B')
      
      expect(result.transit).toHaveLength(1)
      expect(result.walking).toHaveLength(1)
      expect(result.errors.transit).toBeNull()
      expect(result.errors.walking).toBeNull()
    })

    it('returns partial results if one mode fails', async () => {
      // Mock first call (transit) success, second call (walking) failure
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoogleResponse,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
        })

      const result = await getTransitAndWalking('A', 'B')
      
      expect(result.transit).toHaveLength(1)
      expect(result.walking).toHaveLength(0)
      expect(result.errors.walking).toContain('Google Directions returned 403')
    })
  })
})
