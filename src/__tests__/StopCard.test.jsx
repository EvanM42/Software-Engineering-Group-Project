import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StopCard from '../components/StopCard'

describe('StopCard', () => {
  const mockStop = {
    id: '1',
    name: 'Tate Student Center',
    lat: 33.948,
    lng: -83.377,
    route_names: ['East Campus', 'Orbit'],
  }

  it('renders the stop name', () => {
    render(<StopCard stop={mockStop} />)
    expect(screen.getByText('Tate Student Center')).toBeInTheDocument()
  })

  it('renders route badges', () => {
    render(<StopCard stop={mockStop} />)
    expect(screen.getByText('East Campus')).toBeInTheDocument()
    expect(screen.getByText('Orbit')).toBeInTheDocument()
  })

  it('renders distance when provided', () => {
    render(<StopCard stop={mockStop} distance={0.35} />)
    expect(screen.getByText('350m away')).toBeInTheDocument()
  })

  it('renders distance in km when > 1km', () => {
    render(<StopCard stop={mockStop} distance={2.5} />)
    expect(screen.getByText('2.5km away')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<StopCard stop={mockStop} onSelect={onSelect} />)

    fireEvent.click(screen.getByText('Tate Student Center'))
    expect(onSelect).toHaveBeenCalledWith(mockStop)
  })

  it('handles stop with no routes', () => {
    const stopNoRoutes = { ...mockStop, route_names: null }
    render(<StopCard stop={stopNoRoutes} />)

    expect(screen.getByText('Tate Student Center')).toBeInTheDocument()
    expect(screen.queryByText('East Campus')).not.toBeInTheDocument()
  })

  it('applies compact class when compact prop is true', () => {
    const { container } = render(<StopCard stop={mockStop} compact />)
    expect(container.querySelector('.stop-card--compact')).toBeInTheDocument()
  })

  it('has the pin icon', () => {
    render(<StopCard stop={mockStop} />)
    expect(screen.getByText('📍')).toBeInTheDocument()
  })

  it('handles keyboard selection', () => {
    const onSelect = vi.fn()
    render(<StopCard stop={mockStop} onSelect={onSelect} />)
    
    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith(mockStop)
    
    fireEvent.keyDown(card, { key: ' ' })
    expect(onSelect).toHaveBeenCalledTimes(2)
  })
})
