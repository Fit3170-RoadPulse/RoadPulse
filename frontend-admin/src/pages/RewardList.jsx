import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './RewardList.css'

function RewardList() {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchRewards()
  }, [])

  const fetchRewards = async () => {
    const token = localStorage.getItem('adminToken')
    
    try {
      const response = await fetch('http://localhost:8000/api/admin/rewards/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRewards(data)
      } else {
        setError('Failed to load rewards')
      }
    } catch (err) {
      setError('Network error')
      console.error('Rewards error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (rewardId) => {
    if (!window.confirm('Are you sure you want to delete this reward?')) return
    
    const token = localStorage.getItem('adminToken')
    
    try {
      const response = await fetch(`http://localhost:8000/api/admin/rewards/${rewardId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchRewards() // Reload rewards
      } else {
        alert('Failed to delete reward')
      }
    } catch (err) {
      alert('Network error')
      console.error('Delete error:', err)
    }
  }

  if (loading) return <div className="loading">Loading rewards...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="reward-list-container">
      <div className="reward-list-header">
        <h1 className="reward-list-title">Rewards</h1>
        <button 
          onClick={() => navigate('/rewards/new')} 
          className="create-btn"
        >
          + Create Reward
        </button>
      </div>

      {rewards.length === 0 ? (
        <div className="empty-state">
          <p>No rewards found. Create your first reward!</p>
        </div>
      ) : (
        <div className="rewards-grid">
          {rewards.map(reward => (
            <div key={reward.id} className="reward-card">
              {reward.image && (
                <div className="reward-image">
                  <img src={`http://localhost:8000${reward.image}`} alt={reward.name} />
                </div>
              )}
              
              <div className="reward-header">
                <h3 className="reward-title">{reward.name}</h3>
                <span className={`reward-status ${reward.is_active ? 'active' : 'inactive'}`}>
                  {reward.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p className="reward-description">{reward.description}</p>
              
              <div className="reward-details">
                <div className="reward-detail">
                  <span className="detail-label">💰 Cost:</span>
                  <span className="detail-value">{reward.points_cost} points</span>
                </div>
                
                <div className="reward-detail">
                  <span className="detail-label">📦 Stock:</span>
                  <span className="detail-value">
                    {reward.stock === null ? 'Unlimited' : reward.stock}
                  </span>
                </div>
              </div>
              
              <div className="reward-actions">
                <button 
                  onClick={() => navigate(`/rewards/edit/${reward.id}`)}
                  className="edit-btn"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(reward.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RewardList
