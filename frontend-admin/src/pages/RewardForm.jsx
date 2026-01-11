import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './RewardForm.css'

function RewardForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_cost: 100,
    stock: '',
    is_active: true
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEditing) {
      fetchReward()
    }
  }, [id])

  const fetchReward = async () => {
    const token = localStorage.getItem('adminToken')
    
    try {
      const response = await fetch(`http://localhost:8000/api/admin/rewards/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.name,
          description: data.description,
          points_cost: data.points_cost,
          stock: data.stock || '',
          is_active: data.is_active
        })
        if (data.image) {
          setImagePreview(`http://localhost:8000${data.image}`)
        }
      } else {
        setError('Failed to load reward')
      }
    } catch (err) {
      setError('Network error')
      console.error('Fetch reward error:', err)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const token = localStorage.getItem('adminToken')
    const url = isEditing 
      ? `http://localhost:8000/api/admin/rewards/${id}/`
      : 'http://localhost:8000/api/admin/rewards/'
    
    const formDataToSend = new FormData()
    formDataToSend.append('name', formData.name)
    formDataToSend.append('description', formData.description)
    formDataToSend.append('points_cost', formData.points_cost)
    formDataToSend.append('stock', formData.stock === '' ? '' : formData.stock)
    formDataToSend.append('is_active', formData.is_active)
    
    if (imageFile) {
      formDataToSend.append('image', imageFile)
    }
    
    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend
      })

      if (response.ok) {
        navigate('/rewards')
      } else {
        const data = await response.json()
        setError(JSON.stringify(data))
      }
    } catch (err) {
      setError('Network error')
      console.error('Submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="reward-form-container">
      <h1 className="form-title">{isEditing ? 'Edit Reward' : 'Create New Reward'}</h1>
      
      <form onSubmit={handleSubmit} className="reward-form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Reward Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            className="form-input"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter reward name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">Description *</label>
          <textarea
            id="description"
            name="description"
            className="form-textarea"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Enter reward description"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="points_cost" className="form-label">Points Cost *</label>
            <input
              id="points_cost"
              name="points_cost"
              type="number"
              className="form-input"
              value={formData.points_cost}
              onChange={handleChange}
              required
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="stock" className="form-label">Stock (leave empty for unlimited)</label>
            <input
              id="stock"
              name="stock"
              type="number"
              className="form-input"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              placeholder="Unlimited"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="image" className="form-label">Reward Image</label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            className="form-input"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <span>Active Reward</span>
          </label>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/rewards')}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Reward' : 'Create Reward')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RewardForm
