import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<RewardList />} />
          <Route path="rewards" element={<RewardList />} />
          <Route path="rewards/new" element={<RewardForm />} />
          <Route path="rewards/edit/:id" element={<RewardForm />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
