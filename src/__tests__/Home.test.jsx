import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../pages/Home'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Mock supabase
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              { id: '1', origin: 'Tate Center', destination: 'Science Library', user_id: 'u1' },
            ],
            error: null,
          }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { id: 'u1', email: 'test@uga.edu' } },
    logout: vi.fn().mockResolvedValue({ error: null }),
  }),
}))

vi.mock('../hooks/useBusStops', () => ({
  useBusStops: () => ({
    stops: [
      { id: 's1', name: 'Tate Student Center', lat: 33.948, lng: -83.377, route_names: ['East Campus'] },
      { id: 's2', name: 'Science Library', lat: 33.952, lng: -83.375, route_names: ['Orbit'] },
    ],
    loading: false,
    error: null,
  }),
  getNearbyStops: () => [],
}))

vi.mock('../hooks/useBusRoutes', () => ({
  useBusRoutes: () => ({
    routes: [
      { id: 'r1', routeId: 'east', name: 'East Campus', shortName: 'East Campus', color: '#BA0C2F', path: [] },
    ],
    loading: false,
    error: null,
  }),
}))

vi.mock('../services/directionsService', () => ({
  getTransitAndWalking: vi.fn().mockResolvedValue({
    transit: [],
    walking: [],
    errors: { transit: null, walking: null },
  }),
}))

vi.mock('../services/busService', () => ({
  getBusSystemStatus: vi.fn().mockResolvedValue({
    vehicles: [],
    tripUpdates: [],
    errors: {},
    lastUpdated: new Date('2026-04-21T12:00:00Z'),
  }),
}))

vi.mock('../components/BusMap', () => ({
  default: () => <div data-testid="bus-map">Map</div>,
}))

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the navbar', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('UGA Transit')).toBeInTheDocument()
    })
  })

  it('renders the find view by default', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByText('Find a Route')).toBeInTheDocument()
  })

  it('renders the map', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByTestId('bus-map')).toBeInTheDocument()
  })

  it('renders autocomplete inputs for origin and destination', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByPlaceholderText('Search origin stop...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search destination stop...')).toBeInTheDocument()
  })

  it('renders save route button', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByText('Find Route')).toBeInTheDocument()
  })

  it('shows validation when saving with empty fields', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    fireEvent.click(screen.getByText('Find Route'))
    expect(screen.getByText('Please select both stops.')).toBeInTheDocument()
  })

  it('switches to stops view', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    fireEvent.click(screen.getByText('Stops'))
    await waitFor(() => {
      expect(screen.getByText('Bus Stops')).toBeInTheDocument()
    })
  })

  it('switches to saved view', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    fireEvent.click(screen.getByText('Saved'))
    await waitFor(() => {
      expect(screen.getByText('Saved Routes')).toBeInTheDocument()
    })
  })

  it('has Stops, and Saved tabs', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByText('Stops')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('has a logout button', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })
})
