import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RouteCard from '../components/RouteCard'

describe('RouteCard', () => {
  const mockRoute = {
    id: '123',
    origin: 'Tate Center',
    destination: 'Science Library',
  }

  it('renders origin and destination', () => {
    render(<RouteCard route={mockRoute} onDelete={vi.fn()} />)

    expect(screen.getByText(/Tate Center/)).toBeInTheDocument()
    expect(screen.getByText(/Science Library/)).toBeInTheDocument()
  })

  it('renders the arrow separator', () => {
    render(<RouteCard route={mockRoute} onDelete={vi.fn()} />)
    expect(screen.getByText(/↓/)).toBeInTheDocument()
  })

  it('renders a delete button', () => {
    render(<RouteCard route={mockRoute} onDelete={vi.fn()} />)
    expect(screen.getByTitle('Delete Route')).toBeInTheDocument()
  })

  it('calls onDelete with route id when delete is clicked', () => {
    const onDelete = vi.fn()
    render(<RouteCard route={mockRoute} onDelete={onDelete} />)

    fireEvent.click(screen.getByTitle('Delete Route'))
    expect(onDelete).toHaveBeenCalledWith('123')
  })

  it('fetches and shows trips when expanded', async () => {
    const { getDirections } = await import('../services/directionsService')
    vi.mock('../services/directionsService', () => ({
      getDirections: vi.fn(),
    }))

    const mockTrips = [
      {
        duration: '10 mins',
        steps: [{
          travelMode: 'TRANSIT',
          transit: { departureTime: '10:30 AM', arrivalTime: '10:40 AM', lineName: 'Orbit', numStops: 3 }
        }]
      }
    ]
    getDirections.mockResolvedValue(mockTrips)

    render(
      <RouteCard 
        route={mockRoute} 
        onDelete={vi.fn()} 
        activeNotifications={{}}
        notificationLeads={{}}
      />
    )

    const toggleBtn = screen.getByText('View Trips')
    fireEvent.click(toggleBtn)

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('10:30 AM')).toBeInTheDocument()
      expect(screen.getByText('Orbit')).toBeInTheDocument()
    })
  })

  it('shows error message if trip fetch fails', async () => {
    const { getDirections } = await import('../services/directionsService')
    getDirections.mockRejectedValue(new Error('Fetch failed'))

    render(<RouteCard route={mockRoute} onDelete={vi.fn()} />)
    
    fireEvent.click(screen.getByText('View Trips'))

    await waitFor(() => {
      expect(screen.getByText('Could not fetch latest times.')).toBeInTheDocument()
    })
  })
})
