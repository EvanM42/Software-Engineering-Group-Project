import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

// Mock AuthContext
const mockLogin = vi.fn()
const mockUseAuth = vi.fn()
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      session: null,
      loading: false,
    })
  })

  it('renders the login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@uga.edu')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
  })

  it('renders the UGA Transit header', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByText('UGA Transit')).toBeInTheDocument()
  })

  it('shows error when submitting empty fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Log In'))
    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument()
  })

  it('has a link to signup page', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByText('Create an Account')).toBeInTheDocument()
  })

  it('redirects to home when already authenticated', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      session: { user: { id: '1' } },
      loading: false,
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    )

    expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument()
  })

  it('handles successful login', async () => {
    mockLogin.mockResolvedValue({ error: null })
    
    render(<MemoryRouter><Login /></MemoryRouter>)
    
    fireEvent.change(screen.getByPlaceholderText('you@uga.edu'), { target: { value: 'test@uga.edu' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'pass123' } })
    
    fireEvent.click(screen.getByText('Log In'))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@uga.edu', 'pass123')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('handles login error', async () => {
    mockLogin.mockResolvedValue({ error: 'Invalid credentials' })
    
    render(<MemoryRouter><Login /></MemoryRouter>)
    
    fireEvent.change(screen.getByPlaceholderText('you@uga.edu'), { target: { value: 'wrong@uga.edu' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'wrong' } })
    
    fireEvent.click(screen.getByText('Log In'))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('submits correctly on Enter key', () => {
    mockLogin.mockResolvedValue({ error: null })
    render(<MemoryRouter><Login /></MemoryRouter>)
    
    fireEvent.change(screen.getByPlaceholderText('you@uga.edu'), { target: { value: 'test@uga.edu' } })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'pass' } })
    
    fireEvent.keyDown(screen.getByPlaceholderText('Enter your password'), { key: 'Enter' })
    
    expect(mockLogin).toHaveBeenCalled()
  })
})
