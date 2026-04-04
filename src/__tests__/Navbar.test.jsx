import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Navbar from '../components/Navbar'

describe('Navbar', () => {
  const defaultProps = {
    currentView: 'find',
    onViewChange: vi.fn(),
    onSearch: vi.fn(),
    onLogout: vi.fn(),
  }

  it('renders the app title', () => {
    render(<Navbar {...defaultProps} />)
    expect(screen.getByText('UGA Transit')).toBeInTheDocument()
  })

  it('renders Stops, and Saved buttons', () => {
    render(<Navbar {...defaultProps} />)
    expect(screen.getByText('Stops')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('highlights the active view button', () => {
    render(<Navbar {...defaultProps} currentView="stops" />)
    expect(screen.getByText('Stops').className).toContain('active')
    expect(screen.getByText('Saved').className).not.toContain('active')
  })

  it('calls onViewChange when view buttons are clicked', () => {
    const onViewChange = vi.fn()
    render(<Navbar {...defaultProps} onViewChange={onViewChange} />)

    fireEvent.click(screen.getByText('Saved'))
    expect(onViewChange).toHaveBeenCalledWith('saved')

    fireEvent.click(screen.getByText('Stops'))
    expect(onViewChange).toHaveBeenCalledWith('stops')
  })

  it('calls onLogout when logout button is clicked', () => {
    const onLogout = vi.fn()
    render(<Navbar {...defaultProps} onLogout={onLogout} />)

    fireEvent.click(screen.getByText('Logout'))
    expect(onLogout).toHaveBeenCalled()
  })
})
