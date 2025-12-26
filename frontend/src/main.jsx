import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'
import App from './App.jsx'
import SettingMenu from './pages/settingpage/menu/SettingMenu.jsx';
import ChangePassword from "./pages/settingpage/changepassword/ChangePassword.jsx";
import Map from "./pages/Map/Map.jsx"
import NotFound from "./pages/NotFound/NotFound.jsx"
import Emergency from './pages/Emergency/Emergency.jsx';
import Report from './pages/Report/Report.jsx';
import RegistrationPage from './pages/registrationpage/RegistrationPage.jsx';
import EmailVerification from './pages/emailverificationpage/EmailVerification.jsx';
import LoginPage from "./pages/loginpage/login.jsx";
import RewardsPage from './pages/rewardspage/RewardsPage';
import Demo from './components/point-widget-component';
import ProtectedRoute from './components/ProtectedRoute';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* If you want to navigate to a page via filepath, I think you must include the route here */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login-page" element={<LoginPage />} />
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
        <Route path="/change-password" element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        } />
        <Route path="/report" element={
          <ProtectedRoute>
            <Report />
          </ProtectedRoute>
        } />
        <Route path="/Emergency" element={
          <ProtectedRoute>
            <Emergency />
          </ProtectedRoute>
        } />

        {/* Below route for testing. Remove once not needed */}
        <Route path="/demo" element={<Demo />} />

        {/* 404 Not Found - Must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
