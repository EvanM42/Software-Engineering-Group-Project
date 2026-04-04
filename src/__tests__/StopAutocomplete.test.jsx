import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StopAutocomplete from '../components/StopAutocomplete'

const mockStops = [
  { id: '1', name: 'Tate Student Center', route_names: ['East Campus'] },
  { id: '2', name: 'Science Library', route_names: ['Orbit'] },
  { id: '3', name: 'North Campus Deck', route_names: ['North Campus'] },
  { id: '4', name: 'Tate Center South', route_names: ['South'] },
]

describe('StopAutocomplete', () => {
  it('renders the input with placeholder', () => {
    render(
      <StopAutocomplete
        stops={mockStops}
        value=""
        placeholder="Search stops..."
      />
    )
    expect(screen.getByPlaceholderText('Search stops...')).toBeInTheDocument()
  })

  it('shows dropdown when typing a matching query', () => {
    render(
      <StopAutocomplete
        stops={mockStops}
        value=""
        onChange={vi.fn()}
      />
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Tate' },
    })

    expect(screen.getByText('Tate Student Center')).toBeInTheDocument()
    expect(screen.getByText('Tate Center South')).toBeInTheDocument()
  })

  it('does not show non-matching stops', () => {
    render(
      <StopAutocomplete stops={mockStops} value="" onChange={vi.fn()} />
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Science' },
    })

    expect(screen.getByText('Science Library')).toBeInTheDocument()
    expect(screen.queryByText('Tate Student Center')).not.toBeInTheDocument()
  })

  it('calls onSelect when a stop is clicked', () => {
    const onSelect = vi.fn()
    render(
      <StopAutocomplete
        stops={mockStops}
        value=""
        onChange={vi.fn()}
        onSelect={onSelect}
      />
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Science' },
    })

    fireEvent.click(screen.getByText('Science Library'))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Science Library' })
    )
  })

  it('closes dropdown on Escape key', () => {
    render(
      <StopAutocomplete stops={mockStops} value="" onChange={vi.fn()} />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Tate' } })
    expect(screen.getByText('Tate Student Center')).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByText('Tate Student Center')).not.toBeInTheDocument()
  })

  it('calls onChange when typing', () => {
    const onChange = vi.fn()
    render(
      <StopAutocomplete stops={mockStops} value="" onChange={onChange} />
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'North' },
    })

    expect(onChange).toHaveBeenCalledWith('North')
  })

  it('shows no dropdown when query is empty', () => {
    render(
      <StopAutocomplete stops={mockStops} value="" onChange={vi.fn()} />
    )

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '' },
    })

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
