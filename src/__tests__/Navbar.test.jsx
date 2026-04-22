import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../components/Navbar'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Navbar', () => {
  const defaultProps = {
    currentView: 'find',
    onViewChange: vi.fn(),
    onSearch: vi.fn(),
    onLogout: vi.fn(),
  }

  it('renders the app title', () => {
    render(<MemoryRouter><Navbar {...defaultProps} /></MemoryRouter>)
    expect(screen.getByText('UGA Transit')).toBeInTheDocument()
  })

  it('renders Stops, and Saved buttons', () => {
    render(<MemoryRouter><Navbar {...defaultProps} /></MemoryRouter>)
    expect(screen.getByText('Stops')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('highlights the active view button', () => {
    render(<MemoryRouter><Navbar {...defaultProps} currentView="stops" /></MemoryRouter>)
    expect(screen.getByText('Stops').className).toContain('active')
    expect(screen.getByText('Saved').className).not.toContain('active')
  })

  it('calls onViewChange when view buttons are clicked', () => {
    const onViewChange = vi.fn()
    render(<MemoryRouter><Navbar {...defaultProps} onViewChange={onViewChange} /></MemoryRouter>)

    fireEvent.click(screen.getByText('Saved'))
    expect(onViewChange).toHaveBeenCalledWith('saved')

    fireEvent.click(screen.getByText('Stops'))
    expect(onViewChange).toHaveBeenCalledWith('stops')
  })

  it('calls onLogout when logout button is clicked', () => {
    const onLogout = vi.fn()
    render(<MemoryRouter><Navbar {...defaultProps} onLogout={onLogout} /></MemoryRouter>)

    fireEvent.click(screen.getByText('Logout'))
    expect(onLogout).toHaveBeenCalled()
  })

  it('navigates home when the brand is clicked', () => {
    const onHomeClick = vi.fn()
    render(<MemoryRouter><Navbar {...defaultProps} onHomeClick={onHomeClick} /></MemoryRouter>)

    fireEvent.click(screen.getByText('UGA Transit'))
    expect(onHomeClick).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
