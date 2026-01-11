import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Check if user is staff
        if (data.is_staff) {
          // Store tokens and user info
          localStorage.setItem('adminToken', data.access)
          localStorage.setItem('adminRefreshToken', data.refresh)
          localStorage.setItem('adminUser', JSON.stringify({
            username: data.username,
            email: data.email,
            is_staff: data.is_staff,
            is_superuser: data.is_superuser
          }))
          // Navigate to rewards page
          navigate('/rewards')
        } else {
          setError('Only admin users can access this panel')
        }
      } else {
        setError(data.detail || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError('Network error. Please check if the backend is running.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="content">
        <div className="login-header">
          <h1 className="title">RoadPulse Admin</h1>
          <p className="subtitle">Sign in to manage the platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@roadpulse.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
