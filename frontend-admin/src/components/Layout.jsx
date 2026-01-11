import { useNavigate, Outlet } from 'react-router-dom'
import './Layout.css'

function Layout() {
  const navigate = useNavigate()
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')

  if (!localStorage.getItem('adminToken')) {
    navigate('/login')
    return null
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
          <button onClick={() => navigate('/rewards')} className="nav-item">
            🎁 Rewards
          </button>
          <button onClick={() => navigate('/profile')} className="nav-item">
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
