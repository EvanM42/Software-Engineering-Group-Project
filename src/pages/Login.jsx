import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, session, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (authLoading) return null
  if (session) return <Navigate to="/" replace />

  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')
    const result = await login(email, password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">UGA Transit</header>
        <div className="auth-content">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Log in to save and manage your routes</p>

          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@uga.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="auth-button primary"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <div className="auth-divider">
            <span>New to UGA Transit?</span>
          </div>

          <Link to="/signup" className="auth-button secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Create an Account
          </Link>

          <p className="auth-footer">
            Need help? Contact UGA Transit support
          </p>
        </div>
      </div>
    </div>
  )
}
