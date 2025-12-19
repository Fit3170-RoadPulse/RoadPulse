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
import ErrorBoundary from "./components/ErrorBoundary.jsx";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* If you want to navigate to a page via filepath, I think you must include the route here */}
          <Route path="/" element={<App />} />
          <Route path="/login-page" element={<LoginPage />} />
          <Route path="/registration-page" element={<RegistrationPage />} />
          <Route path="/registration-page" element={<RegistrationPage />} />
          <Route path="/setting-menu-page" element={<SettingMenu />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/report" element={<Report />} />
          <Route path="/map" element={<Map />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/Emergency" element={<Emergency />} /> 
          <Route path="/email-verification" element={<EmailVerification />} /> 
          <Route path="/email-verification" element={<EmailVerification />} /> 
          <Route path="/rewards-page" element={<RewardsPage />} /> 
          
          {/* Below route for testing. Remove once not needed */}
          <Route path="/demo" element={<Demo />} />

        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
