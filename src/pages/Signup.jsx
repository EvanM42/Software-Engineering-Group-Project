import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const { signup, session, loading: authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  if (authLoading) return null
  if (session) return <Navigate to="/" replace />

  async function handleSignup() {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const result = await signup(email, password)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Account created! Check your email to confirm your account.')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSignup()
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">UGA Transit</header>
        <div className="auth-content">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join to start saving your favorite routes</p>

          <div className="form-group">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              placeholder="you@uga.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="auth-button primary"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="auth-button secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Log In
          </Link>

          <p className="auth-footer">
            By signing up, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}
