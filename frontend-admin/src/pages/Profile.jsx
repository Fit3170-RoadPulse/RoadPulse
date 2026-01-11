import { useState, useEffect } from 'react'
import './Profile.css'

function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const token = localStorage.getItem('adminToken')
    
    try {
      const response = await fetch('http://localhost:8000/api/admin/profile/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      } else {
        setError('Failed to load profile')
      }
    } catch (err) {
      setError('Network error')
      console.error('Profile error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="profile-container">
      <h1 className="profile-title">Admin Profile</h1>
      
      <div className="profile-card">
        <div className="profile-item">
          <span className="profile-label">Username:</span>
          <span className="profile-value">{profile.username}</span>
        </div>
        
        <div className="profile-item">
          <span className="profile-label">Email:</span>
          <span className="profile-value">{profile.email}</span>
        </div>
        
        <div className="profile-item">
          <span className="profile-label">Staff Status:</span>
          <span className={`profile-badge ${profile.is_staff ? 'active' : ''}`}>
            {profile.is_staff ? '✓ Staff' : 'Not Staff'}
          </span>
        </div>
        
        <div className="profile-item">
          <span className="profile-label">Superuser:</span>
          <span className={`profile-badge ${profile.is_superuser ? 'active' : ''}`}>
            {profile.is_superuser ? '✓ Superuser' : 'Standard'}
          </span>
        </div>
        
        <div className="profile-item">
          <span className="profile-label">Joined:</span>
          <span className="profile-value">
            {new Date(profile.date_joined).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Profile
