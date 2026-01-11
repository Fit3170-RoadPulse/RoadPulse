import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Login from './pages/Login'
import Layout from './components/Layout'
import Profile from './pages/Profile'
import RewardList from './pages/RewardList'
import RewardForm from './pages/RewardForm'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<RewardList />} />
          <Route path="rewards" element={<RewardList />} />
          <Route path="rewards/new" element={<RewardForm />} />
          <Route path="rewards/edit/:id" element={<RewardForm />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        {/* Keep old routes for backwards compatibility */}
        <Route path="/rewards" element={<Navigate to="/dashboard/rewards" replace />} />
        <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

