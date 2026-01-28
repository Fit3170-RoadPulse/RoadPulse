import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'
import App from './App.jsx'
import SettingMenu from './pages/Settings/Menu/SettingMenu.jsx';
import ChangePassword from "./pages/Settings/ChangePassword/ChangePassword.jsx";
import Map from "./pages/Map/Map.jsx"
import NotFound from "./pages/NotFound/NotFound.jsx"
import Emergency from './pages/Emergency/Emergency.jsx';
import Report from './pages/Report/Report.jsx';
import RegistrationPage from './pages/Registration/RegistrationPage.jsx';
import EmailVerification from './pages/EmailVerification/EmailVerification.jsx';
import LoginPage from "./pages/LoginPage/Login.jsx";
import RewardsPage from './pages/Rewards/RewardsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import DefaultRouteOptions from './pages/Settings/DefaultRouteOptions/DefaultRouteOptions';
import ProfilePage from './pages/Profile/ProfilePage';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* If you want to navigate to a page via filepath, I think you must include the route here */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/app" element={<App />} />
          <Route path="/registration-page" element={<RegistrationPage />} />
          <Route path="/email-verification" element={<EmailVerification />} />

          {/* Protected Routes - Authentication required */}
          <Route path="/map" element={
            <ProtectedRoute>
              <Map />
            </ProtectedRoute>
          } />
          <Route path="/rewards-page" element={
            <ProtectedRoute>
              <RewardsPage />
            </ProtectedRoute>
          } />
          <Route path="/setting-menu-page" element={
            <ProtectedRoute>
              <SettingMenu />
            </ProtectedRoute>
          } />
          <Route path="/profile-page" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } />
            <Route path="/default-route-options" element={
            <ProtectedRoute>
              <DefaultRouteOptions />
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          } />
          <Route path="/emergency" element={
            <ProtectedRoute>
              <Emergency />
            </ProtectedRoute>
          } />


          {/* 404 Not Found - Must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
