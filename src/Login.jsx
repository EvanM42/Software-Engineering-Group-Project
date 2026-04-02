import { useState } from 'react'

export default function Login({ onSwitch, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')
    const result = await onLogin(email, password)
    if (result.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  function handleKeyPress(e) {
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
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@uga.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
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

          <button
            onClick={() => onSwitch('signup')}
            disabled={loading}
            className="auth-button secondary"
          >
            Create an Account
          </button>

          <p className="auth-footer">
            Need help? Contact UGA Transit support
          </p>
        </div>
      </div>
    </div>
  )
}
