import { describe, it, expect } from 'vitest'
import { getNearbyStops } from '../hooks/useBusStops'

const mockStops = [
  { id: '1', name: 'Stop A', lat: 33.950, lng: -83.376 },
  { id: '2', name: 'Stop B', lat: 33.955, lng: -83.380 },
  { id: '3', name: 'Stop C', lat: 33.960, lng: -83.390 },
  { id: '4', name: 'Stop D', lat: 33.940, lng: -83.370 },
  { id: '5', name: 'Stop E', lat: 33.930, lng: -83.360 },
  { id: '6', name: 'Stop F', lat: 33.970, lng: -83.400 },
]

describe('getNearbyStops', () => {
  it('returns the N nearest stops', () => {
    const result = getNearbyStops(mockStops, 33.950, -83.376, 3)
    expect(result).toHaveLength(3)
    expect(result[0].name).toBe('Stop A') // closest to itself
  })

  it('returns stops sorted by distance (closest first)', () => {
    const result = getNearbyStops(mockStops, 33.950, -83.376, 6)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].distance).toBeGreaterThanOrEqual(result[i - 1].distance)
    }
  })

  it('adds distance property to each stop', () => {
    const result = getNearbyStops(mockStops, 33.950, -83.376, 2)
    expect(result[0]).toHaveProperty('distance')
    expect(typeof result[0].distance).toBe('number')
  })

  it('returns empty array when stops is empty', () => {
    const result = getNearbyStops([], 33.950, -83.376, 5)
    expect(result).toEqual([])
  })

  it('returns empty array when lat/lng is null', () => {
    const result = getNearbyStops(mockStops, null, null, 5)
    expect(result).toEqual([])
  })

  it('defaults to 5 results', () => {
    const result = getNearbyStops(mockStops, 33.950, -83.376)
    expect(result).toHaveLength(5)
  })

  it('returns all stops when count exceeds total', () => {
    const result = getNearbyStops(mockStops, 33.950, -83.376, 100)
    expect(result).toHaveLength(mockStops.length)
  })

  it('calculates distance as 0 for the exact same point', () => {
    const exactStop = [{ id: '1', name: 'X', lat: 33.950, lng: -83.376 }]
    const result = getNearbyStops(exactStop, 33.950, -83.376, 1)
    expect(result[0].distance).toBe(0)
  })
})
