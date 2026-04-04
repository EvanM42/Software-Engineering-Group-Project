import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
    expect(screen.getByText(/→/)).toBeInTheDocument()
  })

  it('renders a delete button', () => {
    render(<RouteCard route={mockRoute} onDelete={vi.fn()} />)
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onDelete with route id when delete is clicked', () => {
    const onDelete = vi.fn()
    render(<RouteCard route={mockRoute} onDelete={onDelete} />)

    fireEvent.click(screen.getByText('Delete'))
    expect(onDelete).toHaveBeenCalledWith('123')
  })

  it('has card class on the container', () => {
    const { container } = render(
      <RouteCard route={mockRoute} onDelete={vi.fn()} />
    )

    expect(container.querySelector('.card')).toBeInTheDocument()
  })
})
