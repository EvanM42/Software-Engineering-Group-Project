import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Create a controllable mock for useJsApiLoader
const mockUseJsApiLoader = vi.fn()

vi.mock('@react-google-maps/api', () => ({
  useJsApiLoader: (...args) => mockUseJsApiLoader(...args),
  GoogleMap: ({ children }) => {
    // Simulate calling onLoad (but with no real map)
    return <div data-testid="google-map">{children}</div>
  },
  InfoWindow: ({ children }) => <div data-testid="info-window">{children}</div>,
  Polyline: () => <div data-testid="polyline" />,
}))

import BusMap from '../components/BusMap'

const mockStops = [
  { id: '1', name: 'Tate Center', lat: 33.948, lng: -83.377, route_names: ['East Campus'] },
  { id: '2', name: 'Science Library', lat: 33.952, lng: -83.375, route_names: ['Orbit'] },
]

describe('BusMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state when Google Maps is not loaded', () => {
    mockUseJsApiLoader.mockReturnValue({ isLoaded: false, loadError: null })

    render(<BusMap stops={mockStops} />)
    expect(screen.getByText('Loading map...')).toBeInTheDocument()
  })

  it('shows error state when Google Maps fails to load', () => {
    mockUseJsApiLoader.mockReturnValue({ isLoaded: false, loadError: new Error('fail') })

    render(<BusMap stops={mockStops} />)
    expect(screen.getByText(/Failed to load Google Maps/)).toBeInTheDocument()
  })

  it('renders the map when loaded', () => {
    mockUseJsApiLoader.mockReturnValue({ isLoaded: true, loadError: null })

    render(<BusMap stops={mockStops} />)
    expect(screen.getByTestId('google-map')).toBeInTheDocument()
  })

  it('renders with empty stops array', () => {
    mockUseJsApiLoader.mockReturnValue({ isLoaded: true, loadError: null })

    render(<BusMap stops={[]} />)
    expect(screen.getByTestId('google-map')).toBeInTheDocument()
  })

  it('has the map-container class', () => {
    mockUseJsApiLoader.mockReturnValue({ isLoaded: true, loadError: null })

    const { container } = render(<BusMap stops={mockStops} />)
    expect(container.querySelector('.map-container')).toBeInTheDocument()
  })

  it('renders loading spinner', () => {
    mockUseJsApiLoader.mockReturnValue({ isLoaded: false, loadError: null })

    const { container } = render(<BusMap stops={[]} />)
    expect(container.querySelector('.spinner')).toBeInTheDocument()
  })

  it('has map-error class on error', () => {
    mockUseJsApiLoader.mockReturnValue({ isLoaded: false, loadError: new Error('fail') })

    const { container } = render(<BusMap stops={[]} />)
    expect(container.querySelector('.map-error')).toBeInTheDocument()
  })
})
