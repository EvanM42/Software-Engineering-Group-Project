import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'

// Mock supabase
vi.mock('../lib/supabaseClient', () => {
  const mockAuth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }

  return {
    supabase: { auth: mockAuth },
  }
})

function TestConsumer() {
  const { session, user, loading, login, signup, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="session">{session ? 'active' : 'none'}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button onClick={() => login('test@uga.edu', 'password')}>Login</button>
      <button onClick={() => signup('test@uga.edu', 'password')}>Signup</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides auth context to children', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })

    expect(screen.getByTestId('session')).toHaveTextContent('none')
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    )

    consoleSpy.mockRestore()
  })

  it('renders children while loading', () => {
    render(
      <AuthProvider>
        <div data-testid="child">Hello</div>
      </AuthProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
