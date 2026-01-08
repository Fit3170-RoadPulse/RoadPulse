import { useNavigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './Layout.css'

function Layout() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/login')
    } else {
      setIsAuthenticated(true)
    }
  }, [navigate])

  if (isAuthenticated === null) {
    return <div className="loading">Loading...</div>
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminRefreshToken')
    localStorage.removeItem('adminUser')
    navigate('/login')
  }

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">RoadPulse Admin</h2>
          <p className="sidebar-subtitle">{adminUser.username}</p>
        </div>
        
        <nav className="sidebar-nav">
          <button onClick={() => navigate('/dashboard/rewards')} className="nav-item">
            🎁 Rewards
          </button>
          <button onClick={() => navigate('/dashboard/profile')} className="nav-item">
            👤 Profile
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
