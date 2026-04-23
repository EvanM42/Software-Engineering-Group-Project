import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { 
  useBusRoutes, 
  normalizeBusRoute, 
  matchRouteByName, 
  matchRouteById 
} from '../hooks/useBusRoutes'
import { supabase } from '../lib/supabaseClient'

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}))

const mockRouteData = [
  {
    id: 1,
    route_name: 'Orbit',
    short_name: 'OR',
    route_color: 'FF0000',
    path: '[{"lat": 33.95, "lng": -83.37}, {"lat": 33.96, "lng": -83.38}]'
  },
  {
    id: 2,
    name: 'East Campus Express',
    hex_color: '#00FF00',
    stop_ids: [10, 20, 30]
  }
]

describe('useBusRoutes Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches routes from bus_routes primarily', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [mockRouteData[0]], error: null })
    })

    const { result } = renderHook(() => useBusRoutes())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(supabase.from).toHaveBeenCalledWith('bus_routes')
    expect(result.current.routes).toHaveLength(1)
    expect(result.current.routes[0].name).toBe('Orbit')
  })

  it('falls back to routes table if bus_routes fails', async () => {
    // First call fails
    supabase.from.mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'no table' } })
    })
    // Second call (fallback) succeeds
    .mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ data: [mockRouteData[1]], error: null })
    })

    const { result } = renderHook(() => useBusRoutes())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(supabase.from).toHaveBeenCalledWith('routes')
    expect(result.current.routes[0].name).toBe('East Campus Express')
  })

  it('handles errors when both tables fail', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'Major DB Failure' } })
    })

    const { result } = renderHook(() => useBusRoutes())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Major DB Failure')
    expect(result.current.routes).toEqual([])
  })
})

describe('normalizeBusRoute Utility', () => {
  it('handles Supabase snake_case format', () => {
    const raw = {
      id: 'r1',
      route_name: 'Milledge Ave',
      route_color: 'BA0C2F'
    }
    const normalized = normalizeBusRoute(raw)
    expect(normalized.name).toBe('Milledge Ave')
    expect(normalized.color).toBe('#BA0C2F')
    expect(normalized.id).toBe('r1')
  })

  it('handles Google/Generic camelCase format', () => {
    const raw = {
      id: 'r2',
      name: 'North Loop',
      color: '#0000FF'
    }
    const normalized = normalizeBusRoute(raw)
    expect(normalized.name).toBe('North Loop')
    expect(normalized.color).toBe('#0000FF')
  })

  it('provides a fallback color if none exists', () => {
    const normalized = normalizeBusRoute({ name: 'Grey Route' }, 0)
    expect(normalized.color).toBe('#BA0C2F') // First fallback color
  })

  it('cleans and trims labels', () => {
    const normalized = normalizeBusRoute({ route_name: '  Orbit   ' })
    expect(normalized.name).toBe('Orbit')
  })

  it('extracts path from JSON string', () => {
    const raw = { path: '[{"lat": 1, "lng": 2}]' }
    const normalized = normalizeBusRoute(raw)
    expect(normalized.path).toEqual([{ lat: 1, lng: 2 }])
  })

  it('extracts path from array of coordinates', () => {
    const raw = { path: [[33.9, -83.3], [33.8, -83.2]] }
    const normalized = normalizeBusRoute(raw)
    expect(normalized.path).toHaveLength(2)
    expect(normalized.path[0]).toEqual({ lat: 33.9, lng: -83.3 })
  })
})

describe('Route Matching Utilities', () => {
  const routes = [
    normalizeBusRoute({ id: '10', name: 'Orbit', short_name: 'OR' }),
    normalizeBusRoute({ id: '20', name: 'East Campus Express', aliases: ['ECE', 'East Express'] })
  ]

  it('matches exactly by name', () => {
    expect(matchRouteByName(routes, 'Orbit').id).toBe('10')
  })

  it('matches exactly by short name', () => {
    expect(matchRouteByName(routes, 'OR').id).toBe('10')
  })

  it('matches case-insensitively', () => {
    expect(matchRouteByName(routes, 'orbit').id).toBe('10')
  })

  it('matches by alias', () => {
    expect(matchRouteByName(routes, 'ECE').id).toBe('20')
  })

  it('matches fuzzily (substring)', () => {
    expect(matchRouteByName(routes, 'East').id).toBe('20')
  })

  it('matches by ID', () => {
    expect(matchRouteById(routes, '10').name).toBe('Orbit')
  })

  it('returns null if no match found', () => {
    expect(matchRouteByName(routes, 'NonExistent')).toBeNull()
    expect(matchRouteById(routes, '999')).toBeNull()
  })
})
