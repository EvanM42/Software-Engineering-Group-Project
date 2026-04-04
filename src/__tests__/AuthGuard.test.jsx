import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AuthGuard from '../components/AuthGuard'

// Mock the AuthContext
const mockUseAuth = vi.fn()
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('AuthGuard', () => {
  it('shows loading spinner while auth is resolving', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: true })

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to /login when no session', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: false })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when session exists', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1', email: 'test@uga.edu' } },
      loading: false,
    })

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
