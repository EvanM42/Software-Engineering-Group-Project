import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Signup from '../pages/Signup'

// Mock AuthContext
const mockSignup = vi.fn()
const mockUseAuth = vi.fn()
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      signup: mockSignup,
      session: null,
      loading: false,
    })
  })

  it('renders the signup form', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    // 'Create Account' appears as both heading and button
    const createTexts = screen.getAllByText('Create Account')
    expect(createTexts).toHaveLength(2)
    expect(screen.getByPlaceholderText('you@uga.edu')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('At least 6 characters')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument()
  })

  it('renders the UGA Transit header', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    expect(screen.getByText('UGA Transit')).toBeInTheDocument()
  })

  it('shows error when submitting empty fields', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    // There may be multiple "Create Account" text, use getAllByText
    const buttons = screen.getAllByText('Create Account')
    // Click the button (not the heading)
    const createButton = buttons.find(el => el.tagName === 'BUTTON' || el.classList.contains('auth-button'))
    fireEvent.click(createButton)

    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument()
  })

  it('shows error when passwords do not match', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('you@uga.edu'), {
      target: { value: 'test@uga.edu' },
    })
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), {
      target: { value: 'different' },
    })

    const buttons = screen.getAllByText('Create Account')
    const createButton = buttons.find(el => el.tagName === 'BUTTON' || el.classList.contains('auth-button'))
    fireEvent.click(createButton)

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  })

  it('shows error when password is too short', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('you@uga.edu'), {
      target: { value: 'test@uga.edu' },
    })
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
      target: { value: '123' },
    })
    fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), {
      target: { value: '123' },
    })

    const buttons = screen.getAllByText('Create Account')
    const createButton = buttons.find(el => el.tagName === 'BUTTON' || el.classList.contains('auth-button'))
    fireEvent.click(createButton)

    expect(screen.getByText('Password must be at least 6 characters.')).toBeInTheDocument()
  })

  it('has a link to login page', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    expect(screen.getByText('Log In')).toBeInTheDocument()
  })

  it('handles successful signup', async () => {
    const { waitFor } = await import('@testing-library/react')
    mockSignup.mockResolvedValue({ error: null })
    
    render(<MemoryRouter><Signup /></MemoryRouter>)
    
    fireEvent.change(screen.getByPlaceholderText('you@uga.edu'), { target: { value: 'new@uga.edu' } })
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'pass123' } })
    fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), { target: { value: 'pass123' } })
    
    const buttons = screen.getAllByText('Create Account')
    const createButton = buttons.find(el => el.tagName === 'BUTTON')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('new@uga.edu', 'pass123')
      expect(screen.getByText(/Account created/i)).toBeInTheDocument()
    })
  })

  it('submits on Enter key in signup form', () => {
    mockSignup.mockResolvedValue({ error: null })
    render(<MemoryRouter><Signup /></MemoryRouter>)
    
    fireEvent.change(screen.getByPlaceholderText('you@uga.edu'), { target: { value: 'new@uga.edu' } })
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'pass123' } })
    fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), { target: { value: 'pass123' } })
    
    fireEvent.keyDown(screen.getByPlaceholderText('Re-enter your password'), { key: 'Enter' })
    
    expect(mockSignup).toHaveBeenCalled()
  })
})
